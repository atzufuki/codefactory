/**
 * Producer
 * 
 * Executes factory calls from manifest and generates code with marker-based management.
 */

import { dirname, isAbsolute, join } from "@std/path";
import type { FactoryRegistry } from "./registry.ts";
import type { BuildManifest, FactoryCall } from "./manifest.ts";
import type { FactoryResult } from "./types.ts";

export interface BuildError {
  factoryCallId: string;
  error: string;
  stack?: string;
}

export interface BuildResult {
  success: boolean;
  generated: string[];
  errors: BuildError[];
  duration: number;
}

export interface BuildPreview {
  willGenerate: string[];
  willUpdate: string[];
  willCreate: string[];
  errors: string[];
}

export class Producer {
  private manifestDir: string;

  constructor(
    private manifest: BuildManifest,
    private registry: FactoryRegistry,
    manifestPath?: string
  ) {
    // Determine manifest directory for resolving relative paths
    // If manifestPath is provided, use its directory
    // Otherwise use current working directory
    this.manifestDir = manifestPath ? dirname(manifestPath) : Deno.cwd();
  }

  /**
   * Build all factory calls from manifest
   */
  async buildAll(): Promise<BuildResult> {
    const startTime = Date.now();
    const generated: string[] = [];
    const errors: BuildError[] = [];

    // Get execution order (respects dependencies)
    const executionOrder = this.getExecutionOrder();

    for (const factoryCall of executionOrder) {
      try {
        const filePath = await this.executeFactoryCall(factoryCall);
        generated.push(filePath);
      } catch (error) {
        errors.push({
          factoryCallId: factoryCall.id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: errors.length === 0,
      generated,
      errors,
      duration,
    };
  }

  /**
   * Build specific factory calls by ID
   */
  async build(ids: string[]): Promise<BuildResult> {
    const startTime = Date.now();
    const generated: string[] = [];
    const errors: BuildError[] = [];

    // Filter to only requested IDs
    const requestedCalls = this.manifest.factories.filter((f) =>
      ids.includes(f.id)
    );

    if (requestedCalls.length === 0) {
      throw new Error(`No factory calls found with IDs: ${ids.join(", ")}`);
    }

    // Get execution order for requested calls
    const executionOrder = this.getExecutionOrder().filter((f) =>
      ids.includes(f.id)
    );

    for (const factoryCall of executionOrder) {
      try {
        const filePath = await this.executeFactoryCall(factoryCall);
        generated.push(filePath);
      } catch (error) {
        errors.push({
          factoryCallId: factoryCall.id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: errors.length === 0,
      generated,
      errors,
      duration,
    };
  }

  /**
   * Preview what would be generated without actually building
   */
  async dryRun(): Promise<BuildPreview> {
    const willGenerate: string[] = [];
    const willUpdate: string[] = [];
    const willCreate: string[] = [];
    const errors: string[] = [];

    const executionOrder = this.getExecutionOrder();

    for (const factoryCall of executionOrder) {
      try {
        const exists = await this.fileExists(factoryCall.outputPath);
        
        if (exists) {
          const hasMarker = await this.hasMarker(factoryCall.outputPath, factoryCall.id);
          if (hasMarker) {
            willUpdate.push(factoryCall.outputPath);
          } else {
            errors.push(
              `File ${factoryCall.outputPath} exists but has no marker for "${factoryCall.id}"`
            );
          }
        } else {
          willCreate.push(factoryCall.outputPath);
        }
        
        willGenerate.push(factoryCall.outputPath);
      } catch (error) {
        errors.push(
          `Error checking ${factoryCall.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return {
      willGenerate,
      willUpdate,
      willCreate,
      errors,
    };
  }

  /**
   * Execute a single factory call
   */
  private async executeFactoryCall(factoryCall: FactoryCall): Promise<string> {
    // Get factory from registry
    const factory = this.registry.get(factoryCall.factory);
    
    if (!factory) {
      throw new Error(`Factory "${factoryCall.factory}" not found in registry`);
    }

    // Execute factory
    const result: FactoryResult = await factory.execute(factoryCall.params);

    // Determine output path (use factory result or manifest)
    let outputPath = result.filePath ?? factoryCall.outputPath;

    if (!outputPath) {
      throw new Error(
        `No output path specified for factory call "${factoryCall.id}"`
      );
    }

    // Resolve relative paths relative to manifest directory
    outputPath = this.resolveOutputPath(outputPath);

    // Write to file with markers
    await this.writeGeneratedCode(outputPath, result.content, factoryCall.id);

    return outputPath;
  }

  /**
   * Resolve output path relative to manifest directory
   */
  private resolveOutputPath(path: string): string {
    if (isAbsolute(path)) {
      return path;
    }
    return join(this.manifestDir, path);
  }

  /**
   * Write generated code to file with marker-based management
   * 
   * @param filePath - Output file path
   * @param content - Generated content
   * @param factoryNameOrId - Factory name (new format) or factory call ID (legacy)
   * @param useLegacyMarker - If true, use old id-based markers (for backwards compatibility)
   */
  private async writeGeneratedCode(
    filePath: string,
    content: string,
    factoryNameOrId: string,
    useLegacyMarker: boolean = true
  ): Promise<void> {
    // Use different marker syntax for template files (.hbs, .template, .handlebars)
    const isTemplateFile = /\.(hbs|template|handlebars)$/.test(filePath);
    
    // NEW FORMAT: factory="name" (for extraction-based system)
    // OLD FORMAT: id="uuid" (for manifest-based system, backwards compatible)
    const markerAttr = useLegacyMarker ? `id="${factoryNameOrId}"` : `factory="${factoryNameOrId}"`;
    
    const markerStart = isTemplateFile
      ? `{{!-- @codefactory:start ${markerAttr} --}}`
      : `// @codefactory:start ${markerAttr}`;
    const markerEnd = isTemplateFile
      ? `{{!-- @codefactory:end --}}`
      : `// @codefactory:end`;

    // Check if file exists
    const exists = await this.fileExists(filePath);

    if (!exists) {
      // Create new file with markers
      const fileContent = `${markerStart}\n${content}\n${markerEnd}\n`;
      await this.ensureDir(filePath);
      await Deno.writeTextFile(filePath, fileContent);
      return;
    }

    // File exists - check for markers
    const existingContent = await Deno.readTextFile(filePath);

    if (!existingContent.includes(markerStart)) {
      throw new Error(
        `File ${filePath} exists but has no marker for "${factoryNameOrId}".\n\n` +
        `Options:\n` +
        `1. Delete the file and run /codefactory.produce again\n` +
        `2. Add marker manually:\n   ${markerStart}\n   ${markerEnd}\n` +
        `3. Change outputPath in manifest to a different file`
      );
    }

    // Replace content between markers
    const updated = this.replaceBetweenMarkers(
      existingContent,
      markerStart,
      markerEnd,
      content
    );

    await Deno.writeTextFile(filePath, updated);
  }

  /**
   * Replace content between markers
   */
  private replaceBetweenMarkers(
    source: string,
    startMarker: string,
    endMarker: string,
    newContent: string
  ): string {
    const startIdx = source.indexOf(startMarker);
    const endIdx = source.indexOf(endMarker, startIdx);

    if (startIdx === -1 || endIdx === -1) {
      throw new Error("Markers not found or malformed");
    }

    const before = source.slice(0, startIdx);
    const after = source.slice(endIdx + endMarker.length);

    return `${before}${startMarker}\n${newContent}\n${endMarker}${after}`;
  }

  /**
   * Check if file exists
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check if file has marker for given factory call ID
   */
  private async hasMarker(filePath: string, factoryCallId: string): Promise<boolean> {
    try {
      const content = await Deno.readTextFile(filePath);
      const markerStart = `// @codefactory:start id="${factoryCallId}"`;
      return content.includes(markerStart);
    } catch {
      return false;
    }
  }

  /**
   * Ensure directory exists for file path
   */
  private async ensureDir(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    if (dir && dir !== ".") {
      await Deno.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Get execution order from manifest (with circular dependency detection)
   */
  private getExecutionOrder(): FactoryCall[] {
    const calls = [...this.manifest.factories];
    const sorted: FactoryCall[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (call: FactoryCall) => {
      if (visited.has(call.id)) {
        return;
      }

      if (visiting.has(call.id)) {
        throw new Error(`Circular dependency detected involving "${call.id}"`);
      }

      visiting.add(call.id);

      // Visit dependencies first
      if (call.dependsOn) {
        for (const depId of call.dependsOn) {
          const depCall = calls.find((c) => c.id === depId);
          if (!depCall) {
            throw new Error(`Dependency "${depId}" not found for "${call.id}"`);
          }
          visit(depCall);
        }
      }

      visiting.delete(call.id);
      visited.add(call.id);
      sorted.push(call);
    };

    for (const call of calls) {
      visit(call);
    }

    return sorted;
  }

  // ============================================================================
  // EXTRACTION-BASED METHODS (New approach - no manifest needed)
  // ============================================================================

  /**
   * Sync all files with @codefactory markers in a directory
   * 
   * This is the new extraction-based approach where:
   * 1. Scan directory for files with @codefactory markers
   * 2. Extract factory name from marker
   * 3. Extract parameters from source code using template
   * 4. Regenerate factory section
   * 5. Replace marked section, preserve custom code
   * 
   * @param directory - Directory to scan for codefactory files
   * @returns Build result with synced files
   */
  async syncAll(directory: string): Promise<BuildResult> {
    const startTime = Date.now();
    const generated: string[] = [];
    const errors: BuildError[] = [];

    // Find all files with @codefactory markers
    const files = await this.scanCodefactoryFiles(directory);

    for (const filePath of files) {
      try {
        await this.syncFile(filePath);
        generated.push(filePath);
      } catch (error) {
        errors.push({
          factoryCallId: filePath,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: errors.length === 0,
      generated,
      errors,
      duration,
    };
  }

  /**
   * Sync a single file with @codefactory marker
   * 
   * Process:
   * 1. Read source file
   * 2. Extract factory name from marker
   * 3. Get factory and template from registry
   * 4. Extract parameters from source using template
   * 5. Regenerate code with extracted params
   * 6. Replace only the marked section
   * 
   * @param filePath - Path to file to sync
   */
  async syncFile(filePath: string): Promise<void> {
    const source = await Deno.readTextFile(filePath);
    
    // Extract factory name from marker
    const marker = this.extractMarker(source);
    if (!marker) {
      throw new Error(`No @codefactory marker found in ${filePath}`);
    }
    
    // Get factory from registry
    const factory = this.registry.get(marker.factoryName);
    if (!factory) {
      throw new Error(`Factory "${marker.factoryName}" not found in registry`);
    }
    
    // Get template from factory
    const template = factory.getTemplate();
    if (!template) {
      throw new Error(
        `Factory "${marker.factoryName}" has no template (cannot extract parameters)`
      );
    }
    
    // Import extractor dynamically to avoid circular dependency
    const { extractAllParams } = await import("./extractor.ts");
    
    // Extract marked section only (not whole file)
    const markedSection = this.extractMarkedSection(source, marker);
    
    // Extract params from marked section using template
    const params = extractAllParams(markedSection, template);
    
    // Regenerate code with extracted params
    const result = await factory.execute(params);
    
    // Replace only the marked section
    const updated = this.replaceMarkedSection(source, result.content, marker);
    
    // Write back to file
    await Deno.writeTextFile(filePath, updated);
  }

  /**
   * Create a new file using a factory (extraction-based workflow)
   * 
   * This generates a file with the new marker format: factory="name"
   * 
   * @param factoryName - Name of the factory to use
   * @param params - Parameters for the factory
   * @param outputPath - Where to write the file
   */
  async createFile(
    factoryName: string,
    params: Record<string, unknown>,
    outputPath: string
  ): Promise<void> {
    // Get factory from registry
    const factory = this.registry.get(factoryName);
    if (!factory) {
      throw new Error(`Factory "${factoryName}" not found in registry`);
    }

    // Execute factory
    const result = await factory.execute(params);

    // Resolve output path
    const resolvedPath = this.resolveOutputPath(outputPath);

    // Write with NEW marker format (factory="name")
    await this.writeGeneratedCode(resolvedPath, result.content, factoryName, false);
  }

  /**
   * Scan directory for files containing @codefactory markers
   */
  private async scanCodefactoryFiles(directory: string): Promise<string[]> {
    const files: string[] = [];

    async function scan(dir: string) {
      try {
        for await (const entry of Deno.readDir(dir)) {
          const fullPath = join(dir, entry.name);
          
          if (entry.isDirectory) {
            // Skip node_modules, .git, etc.
            if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
              await scan(fullPath);
            }
          } else if (entry.isFile) {
            try {
              const content = await Deno.readTextFile(fullPath);
              if (content.includes("@codefactory:start")) {
                files.push(fullPath);
              }
            } catch {
              // Skip files that can't be read as text
            }
          }
        }
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }
    }

    await scan(directory);
    return files;
  }

  /**
   * Extract factory name from @codefactory:start marker
   * 
   * Supports both formats:
   * - NEW: factory="component_factory"
   * - OLD: id="uuid-here" (not supported by extraction, needs manifest)
   */
  private extractMarker(source: string): { factoryName: string; isTemplateFile: boolean } | null {
    // Try new format: factory="name"
    const factoryMatch = source.match(/\/\/\s*@codefactory:start\s+factory="(\w+)"/);
    if (factoryMatch) {
      return { factoryName: factoryMatch[1], isTemplateFile: false };
    }

    // Try template file format
    const templateMatch = source.match(/\{\{!--\s*@codefactory:start\s+factory="(\w+)"\s*--\}\}/);
    if (templateMatch) {
      return { factoryName: templateMatch[1], isTemplateFile: true };
    }

    // Old format not supported by extraction system
    if (source.includes('@codefactory:start id=')) {
      throw new Error(
        'Old marker format (id="...") detected. Extraction system requires new format (factory="...").\n' +
        'Please update markers or use manifest-based buildAll() method.'
      );
    }

    return null;
  }

  /**
   * Extract content between @codefactory markers
   */
  private extractMarkedSection(source: string, marker: { isTemplateFile: boolean }): string {
    const startPattern = marker.isTemplateFile
      ? /\{\{!--\s*@codefactory:start[^>]*--\}\}/
      : /\/\/\s*@codefactory:start[^\n]*/;
    const endPattern = marker.isTemplateFile
      ? /\{\{!--\s*@codefactory:end\s*--\}\}/
      : /\/\/\s*@codefactory:end/;

    const startMatch = source.match(startPattern);
    const endMatch = source.match(endPattern);

    if (!startMatch || !endMatch) {
      throw new Error("Malformed @codefactory markers");
    }

    const startIdx = startMatch.index! + startMatch[0].length;
    const endIdx = endMatch.index!;

    return source.slice(startIdx, endIdx).trim();
  }

  /**
   * Replace marked section with new content
   */
  private replaceMarkedSection(
    source: string,
    newContent: string,
    marker: { isTemplateFile: boolean }
  ): string {
    const startPattern = marker.isTemplateFile
      ? /\{\{!--\s*@codefactory:start[^>]*--\}\}/
      : /\/\/\s*@codefactory:start[^\n]*/;
    const endPattern = marker.isTemplateFile
      ? /\{\{!--\s*@codefactory:end\s*--\}\}/
      : /\/\/\s*@codefactory:end/;

    const startMatch = source.match(startPattern);
    const endMatch = source.match(endPattern);

    if (!startMatch || !endMatch) {
      throw new Error("Malformed @codefactory markers");
    }

    const before = source.slice(0, startMatch.index! + startMatch[0].length);
    const after = source.slice(endMatch.index!);

    return `${before}\n${newContent}\n${after}`;
  }
}
