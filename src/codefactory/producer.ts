/**
 * Producer - Metadata-based code generation
 * 
 * Creates files from factories and syncs edited files with metadata.
 */

import { dirname } from "@std/path";
import { walk } from "@std/fs/walk";
import type { FactoryRegistry } from "./registry.ts";
import { extractMetadata, generateFile } from "./metadata.ts";

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
   * Create a new file from a factory (metadata-based workflow)
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

    // Factory templates (.codefactory) should NOT get metadata
    // They are templates themselves, not generated code
    const isTemplate = outputPath.endsWith('.codefactory');
    
    const fileContent = isTemplate
      ? result.content.trim() + '\n'
      : generateFile(factoryName, params, result.content);

    // Ensure directory exists
    await Deno.mkdir(dirname(outputPath), { recursive: true });

    // Write file
    await Deno.writeTextFile(outputPath, fileContent);
  }

  /**
   * Sync all files in a directory that have @codefactory metadata
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
   * Sync a single file with @codefactory metadata
   * 
   * Process:
   * 1. Read source file
   * 2. Extract metadata (factory name and params)
   * 3. Get factory from registry
   * 4. Regenerate code with metadata params
   * 5. Replace entire file content
   * 
   * @param filePath - Path to file to sync
   */
  async syncFile(filePath: string): Promise<void> {
    const source = await Deno.readTextFile(filePath);
    
    // Extract metadata from JSDoc block
    const metadata = extractMetadata(source);
    if (!metadata) {
      throw new Error(`No @codefactory metadata found in ${filePath}`);
    }
    
    // Get factory from registry
    const factory = this.registry.get(metadata.factoryName);
    if (!factory) {
      throw new Error(`Factory "${metadata.factoryName}" not found in registry`);
    }

    // Regenerate with metadata params
    const result = await factory.execute(metadata.params);

    // Generate new file content with metadata
    const newContent = generateFile(metadata.factoryName, metadata.params, result.content);

    await Deno.writeTextFile(filePath, newContent);
  }

  /**
   * Scan directory for files with @codefactory metadata
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
      // Look for JSDoc @codefactory metadata
      if (content.includes('@codefactory')) {
        files.push(entry.path);
      }
    }
    
    return files;
  }
}
