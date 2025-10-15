/**
 * Registry for managing available factories
 */

import { Factory } from "./factory.ts";
import type { FactoryDefinition } from "./types.ts";

export interface AutoRegisterOptions {
  /** Glob pattern to match files (default: "*.ts") */
  pattern?: string;
  /** Files to exclude (default: ["index.ts"]) */
  exclude?: string[];
  /** Whether to search subdirectories recursively (default: false) */
  recursive?: boolean;
}

interface DiscoveryOptions {
  pattern: string;
  exclude: string[];
  recursive: boolean;
}

export class FactoryRegistry {
  private factories = new Map<string, Factory>();

  /**
   * Register a new factory
   */
  register(definition: FactoryDefinition): void {
    if (this.factories.has(definition.name)) {
      throw new Error(`Factory "${definition.name}" is already registered`);
    }
    const factory = new Factory(definition);
    this.factories.set(definition.name, factory);
  }

  /**
   * Get a factory by name
   */
  get(name: string): Factory | undefined {
    return this.factories.get(name);
  }

  /**
   * List all registered factories
   */
  list(): Array<{ name: string; description: string }> {
    return Array.from(this.factories.values()).map((factory) => {
      const metadata = factory.getMetadata();
      return {
        name: metadata.name,
        description: metadata.description,
      };
    });
  }

  /**
   * Get all factory metadata for AI consumption
   */
  getCatalog() {
    return Array.from(this.factories.values()).map((factory) => factory.getMetadata());
  }

  /**
   * Auto-discover and register factories from a directory
   * 
   * @param baseUrl - The import.meta.url of the calling file
   * @param options - Configuration options
   * 
   * @example
   * // In factories/index.ts
   * await registry.autoRegister(import.meta.url);
   * 
   * @example
   * // With options
   * await registry.autoRegister(import.meta.url, {
   *   pattern: '*.factory.ts',
   *   exclude: ['index.ts', '*.test.ts'],
   *   recursive: true,
   * });
   */
  async autoRegister(
    baseUrl: string,
    options: AutoRegisterOptions = {}
  ): Promise<void> {
    const {
      pattern = "*.ts",
      exclude = ["index.ts"],
      recursive = false,
    } = options;

    const basePath = new URL(".", baseUrl).pathname;
    // Normalize Windows paths
    const normalizedPath = basePath.replace(/^\/([A-Z]:)/, "$1");
    
    const factories = await this.discoverFactories(normalizedPath, {
      pattern,
      exclude,
      recursive,
    });

    for (const factory of factories) {
      this.register(factory);
    }
  }

  /**
   * Discover factories in a directory
   */
  private async discoverFactories(
    dirPath: string,
    options: DiscoveryOptions
  ): Promise<FactoryDefinition[]> {
    const factories: FactoryDefinition[] = [];

    try {
      for await (const entry of Deno.readDir(dirPath)) {
        // Skip excluded files
        if (this.shouldExclude(entry.name, options.exclude)) {
          continue;
        }

        if (entry.isFile) {
          // Check if file matches pattern
          if (this.matchesPattern(entry.name, options.pattern)) {
            const filePath = `${dirPath}/${entry.name}`;
            const discovered = await this.loadFactoriesFromFile(filePath);
            factories.push(...discovered);
          }
        } else if (entry.isDirectory && options.recursive) {
          // Recursively discover in subdirectories
          const subFactories = await this.discoverFactories(
            `${dirPath}/${entry.name}`,
            options
          );
          factories.push(...subFactories);
        }
      }
    } catch (error) {
      // Directory doesn't exist or not readable - silently return empty array
      if (!(error instanceof Deno.errors.NotFound)) {
        console.warn(`Failed to read directory ${dirPath}:`, error);
      }
    }

    return factories;
  }

  /**
   * Load all factory exports from a TypeScript file
   */
  private async loadFactoriesFromFile(
    filePath: string
  ): Promise<FactoryDefinition[]> {
    try {
      const fileUrl = new URL(`file://${filePath}`);
      const module = await import(fileUrl.href);
      const factories: FactoryDefinition[] = [];

      // Check all exports for FactoryDefinition objects
      for (const value of Object.values(module)) {
        if (this.isFactoryDefinition(value)) {
          factories.push(value as FactoryDefinition);
        }
      }

      return factories;
    } catch (error) {
      console.warn(`Failed to load factories from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Type guard to check if an object is a FactoryDefinition
   */
  private isFactoryDefinition(obj: unknown): obj is FactoryDefinition {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "name" in obj &&
      "description" in obj &&
      "generate" in obj &&
      typeof (obj as FactoryDefinition).name === "string" &&
      typeof (obj as FactoryDefinition).generate === "function"
    );
  }

  /**
   * Check if filename should be excluded
   */
  private shouldExclude(filename: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        return regex.test(filename);
      }
      return filename === pattern;
    });
  }

  /**
   * Check if filename matches pattern
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return regex.test(filename);
  }
}
