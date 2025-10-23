/**
 * codefactory_sync tool
 * 
 * Syncs files with @codefactory markers by re-extracting parameters
 * and regenerating factory sections.
 * Maps to /codefactory.sync command.
 * 
 * This is the core of the extraction-based workflow.
 */

import type { MCPTool, MCPToolResult } from "../types.ts";
import { loadRegistry } from "../utils/factory-registry.ts";
import { Producer, type BuildError } from "../../codefactory/producer.ts";
import { isAbsolute, join } from "@std/path";

export const syncTool: MCPTool = {
  name: "codefactory_sync",
  description: `Smart context-aware sync for CodeFactory files.

Behavior depends on the path:
- Source file (.ts, .tsx, etc.) with @codefactory metadata: Syncs only that file
- Factory template (.hbs, .template): Syncs all files using that factory
- Directory: Syncs all files with @codefactory metadata in directory
- No path: Syncs current working directory

This is the recommended way to sync - it automatically determines the right action.`,
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Optional: File or directory path to sync. If not provided, syncs current directory.",
      },
      factoriesPath: {
        type: "string",
        description: "Optional: Path to factories directory",
      },
    },
    required: [],
  },

  async execute(args: Record<string, unknown>): Promise<MCPToolResult> {
    try {
      // Load registry
      const registry = await loadRegistry(
        args.factoriesPath as string | undefined
      );
      
      // Create producer
      const producer = new Producer(registry);
      
      // Determine what to sync
      const targetPath = (args.path as string) ?? Deno.cwd();
      const resolvedPath = isAbsolute(targetPath) ? targetPath : join(Deno.cwd(), targetPath);
      
      // Check if target is file or directory
      let result;
      try {
        const stat = await Deno.stat(resolvedPath);
        
        if (stat.isFile) {
          const fileName = resolvedPath.split(/[/\\]/).pop() || "";
          
          // Check if it's a factory template
          if (fileName.endsWith('.hbs') || fileName.endsWith('.template')) {
            // Factory file - sync all files using this factory
            const factoryName = fileName.replace(/\.(hbs|template)$/, "");
            result = await syncByFactory(producer, resolvedPath, factoryName);
          } else {
            // Source file - sync just this file
            await producer.syncFile(resolvedPath);
            result = {
              success: true,
              generated: [resolvedPath],
              errors: [],
              duration: 0,
            };
          }
        } else if (stat.isDirectory) {
          // Sync all files in directory
          const startTime = Date.now();
          result = await producer.syncAll(resolvedPath);
          result.duration = Date.now() - startTime;
        } else {
          return {
            content: [{
              type: "text",
              text: `❌ Error: ${resolvedPath} is neither a file nor a directory`,
            }],
            isError: true,
          };
        }
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          return {
            content: [{
              type: "text",
              text: `❌ Error: Path not found: ${resolvedPath}`,
            }],
            isError: true,
          };
        }
        throw error;
      }
      
      // Format response
      if (result.success) {
        const response = [
          `✅ Synced ${result.generated.length} file(s) in ${result.duration}ms`,
          "",
          "📝 Files synced:",
          ...result.generated.map((f: string) => `  - ${f}`),
          "",
          "💡 Changes:",
          "  - Parameters extracted from source code",
          "  - Factory sections regenerated",
          "  - Custom code preserved (outside markers)",
        ].join("\n");
        
        return {
          content: [{
            type: "text",
            text: response,
          }],
        };
      } else {
        const response = [
          `⚠️  Sync completed with ${result.errors.length} error(s)`,
          "",
          "✅ Successfully synced:",
          ...result.generated.map((f: string) => `  - ${f}`),
          "",
          "❌ Errors:",
          ...result.errors.map((e: BuildError) => 
            `  - ${e.factoryCallId}:\n    ${e.error}`
          ),
        ].join("\n");
        
        return {
          content: [{
            type: "text",
            text: response,
          }],
          isError: true,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      
      return {
        content: [{
          type: "text",
          text: `❌ Error: ${message}${stack ? `\n\nStack trace:\n${stack}` : ""}`,
        }],
        isError: true,
      };
    }
  },
};

/**
 * Sync all files that use a specific factory
 */
async function syncByFactory(
  producer: Producer,
  factoryFilePath: string,
  factoryName: string
): Promise<{ success: boolean; generated: string[]; errors: BuildError[]; duration: number }> {
  const startTime = Date.now();
  const generated: string[] = [];
  const errors: BuildError[] = [];

  // Find directory to scan (typically project root or src/)
  const workspaceRoot = findWorkspaceRoot(factoryFilePath);
  const srcDir = join(workspaceRoot, "src");

  // Find all files using this factory
  const files = await findFilesUsingFactory(srcDir, factoryName);

  for (const file of files) {
    try {
      await producer.syncFile(file);
      generated.push(file);
    } catch (error) {
      errors.push({
        factoryCallId: file,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  return {
    success: errors.length === 0,
    generated,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Find workspace root from a file path
 */
function findWorkspaceRoot(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  
  // Look for common workspace indicators
  for (let i = parts.length - 1; i >= 0; i--) {
    const testPath = parts.slice(0, i + 1).join('/');
    try {
      // Check if .codefactory.json exists
      Deno.statSync(join(testPath, '.codefactory.json'));
      return testPath;
    } catch {
      // Continue searching
    }
  }
  
  // Fallback to parent of factories directory
  const factoriesIndex = parts.findIndex(p => p === 'factories');
  if (factoriesIndex > 0) {
    return parts.slice(0, factoriesIndex).join('/');
  }
  
  // Last resort: use cwd
  return Deno.cwd();
}

/**
 * Recursively find all files using a specific factory
 */
async function findFilesUsingFactory(
  directory: string,
  factoryName: string
): Promise<string[]> {
  const files: string[] = [];

  try {
    for await (const entry of Deno.readDir(directory)) {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory) {
        const subFiles = await findFilesUsingFactory(fullPath, factoryName);
        files.push(...subFiles);
      } else if (entry.isFile) {
        if (await fileUsesFactory(fullPath, factoryName)) {
          files.push(fullPath);
        }
      }
    }
  } catch {
    // Ignore errors (directory not found, permission denied, etc.)
  }

  return files;
}

/**
 * Check if file uses a specific factory
 */
async function fileUsesFactory(
  filePath: string,
  factoryName: string
): Promise<boolean> {
  try {
    const content = await Deno.readTextFile(filePath);
    return content.includes(`@codefactory ${factoryName}`);
  } catch {
    return false;
  }
}
