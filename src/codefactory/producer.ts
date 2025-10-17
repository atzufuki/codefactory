/**
 * Producer - Extraction-based code generation
 * 
 * Creates files from factories and syncs edited files with extraction.
 */

import { dirname } from "@std/path";
import { walk } from "@std/fs/walk";
import type { FactoryRegistry } from "./registry.ts";
import { extractAllParams } from "./extractor.ts";

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
  constructor(private registry: FactoryRegistry) {}

  /**
   * Create a new file from a factory (extraction-based workflow)
   * 
   * @param factoryName - Name of factory to use
   * @param params - Parameters to pass to factory
   * @param outputPath - Where to write the file
   */
  async createFile(
    factoryName: string,
    params: Record<string, unknown>,
    outputPath: string
  ): Promise<void> {
    const factory = this.registry.get(factoryName);
    if (!factory) {
      throw new Error(`Factory "${factoryName}" not found in registry`);
    }

    // Check if file already exists
    try {
      await Deno.stat(outputPath);
      throw new Error(
        `File already exists: ${outputPath}. Use syncFile() to update it.`
      );
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }

    // Execute factory
    const result = await factory.execute(params);

    // Wrap in markers with factory name
    const markedContent = this.wrapInMarkers(result.content, factoryName);

    // Ensure directory exists
    await Deno.mkdir(dirname(outputPath), { recursive: true });

    // Write file
    await Deno.writeTextFile(outputPath, markedContent);
  }

  /**
   * Sync all files in a directory that have @codefactory markers
   * 
   * @param directory - Directory to scan recursively
   */
  async syncAll(directory: string): Promise<BuildResult> {
    const startTime = Date.now();
    const generated: string[] = [];
    const errors: BuildError[] = [];

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

    // Check if factory has a template (required for extraction)
    if (!factory.template) {
      throw new Error(
        `Factory "${marker.factoryName}" has no template. Cannot extract parameters for sync.`
      );
    }

    // Extract just the content between markers (not the marker lines themselves)
    const startMarkerLine = source.substring(0, marker.start + source.substring(marker.start).indexOf('\n') + 1);
    const startContentPos = startMarkerLine.length;
    const endMarkerPos = source.indexOf('// @codefactory:end', startContentPos);
    const contentBeforeEndMarker = source.substring(startContentPos, endMarkerPos).trimEnd();
    
    // Extract parameters from the actual code
    const extractedParams = extractAllParams(contentBeforeEndMarker, factory.template);

    // Regenerate with extracted params
    const result = await factory.execute(extractedParams);

    // Replace entire marked section (including markers) with regenerated code
    const before = source.substring(0, marker.start);
    const after = source.substring(marker.end);
    const newContent = before + this.wrapInMarkers(result.content, marker.factoryName) + after;

    await Deno.writeTextFile(filePath, newContent);
  }

  /**
   * Wrap code in @codefactory markers
   */
  private wrapInMarkers(code: string, factoryName: string): string {
    return `// @codefactory:start factory="${factoryName}"\n${code}\n// @codefactory:end`;
  }

  /**
   * Extract marker information from source code
   */
  private extractMarker(source: string): {
    factoryName: string;
    start: number;
    end: number;
  } | null {
    // New format: factory="name"
    const newMarkerRegex = /\/\/ @codefactory:start factory="([^"]+)"/;
    const newMatch = source.match(newMarkerRegex);
    
    if (newMatch) {
      const factoryName = newMatch[1];
      const startPos = source.indexOf(newMatch[0]);
      const startLineEnd = source.indexOf('\n', startPos) + 1;
      
      const endMarker = '// @codefactory:end';
      const endPos = source.indexOf(endMarker, startLineEnd);
      
      if (endPos === -1) {
        throw new Error('Found start marker but no end marker');
      }
      
      return {
        factoryName,
        start: startPos,
        end: endPos + endMarker.length,
      };
    }

    // Legacy format: id="uuid" (for backwards compatibility)
    const legacyMarkerRegex = /\/\/ @codefactory:start id="([^"]+)"/;
    const legacyMatch = source.match(legacyMarkerRegex);
    
    if (legacyMatch) {
      throw new Error(
        'Legacy marker format detected (id="..."). ' +
        'Please update to new format: factory="factory_name". ' +
        'Delete file and recreate with /codefactory.create'
      );
    }

    return null;
  }

  /**
   * Scan directory for files with @codefactory markers
   */
  private async scanCodefactoryFiles(directory: string): Promise<string[]> {
    const files: string[] = [];
    
    // Only scan source code files (whitelist approach)
    const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.cs', '.cpp', '.c', '.h'];
    
    // Skip common non-source directories
    const skipDirs = ['.git', 'node_modules', '.vscode', 'dist', 'build', 'coverage', '.github'];
    
    for await (const entry of walk(directory, { 
      includeFiles: true, 
      includeDirs: false,
      skip: skipDirs.map(dir => new RegExp(`[\\\\/]${dir}[\\\\/]`))
    })) {
      // Only process whitelisted source file extensions
      if (!sourceExtensions.some(ext => entry.path.endsWith(ext))) {
        continue;
      }
      
      const content = await Deno.readTextFile(entry.path);
      if (content.includes('@codefactory:start')) {
        files.push(entry.path);
      }
    }
    
    return files;
  }
}
