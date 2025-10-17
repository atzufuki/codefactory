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
import { Producer } from "../../codefactory/producer.ts";
import { isAbsolute, join } from "@std/path";

export const syncTool: MCPTool = {
  name: "codefactory_sync",
  description: "Sync files with @codefactory markers (extraction-based workflow)",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Optional: File or directory path to sync (default: current directory)",
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
          // Sync single file
          await producer.syncFile(resolvedPath);
          result = {
            success: true,
            generated: [resolvedPath],
            errors: [],
            duration: 0,
          };
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
          ...result.generated.map(f => `  - ${f}`),
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
          ...result.generated.map(f => `  - ${f}`),
          "",
          "❌ Errors:",
          ...result.errors.map(e => 
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
