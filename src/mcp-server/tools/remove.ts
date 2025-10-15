/**
 * codefactory_remove tool
 * 
 * Removes a factory call from the manifest.
 * Maps to /codefactory.remove command.
 */

import type { MCPTool, MCPToolResult } from "../types.ts";
import { loadManifest } from "../utils/manifest-loader.ts";

export const removeTool: MCPTool = {
  name: "codefactory_remove",
  description: "Remove a factory call from the manifest",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the factory call to remove",
      },
      deleteFile: {
        type: "boolean",
        description: "Whether to also delete the generated file",
      },
      force: {
        type: "boolean",
        description: "Force removal even if others depend on it",
      },
      manifestPath: {
        type: "string",
        description: "Optional: Path to manifest file",
      },
    },
    required: ["id"],
  },

  async execute(args: Record<string, unknown>): Promise<MCPToolResult> {
    const id = args.id as string;
    const deleteFile = args.deleteFile as boolean ?? false;
    const force = args.force as boolean ?? false;
    
    try {
      const manager = await loadManifest(args.manifestPath as string | undefined);
      
      // Get the call before removing
      const call = manager.getAllFactoryCalls().find((c) => c.id === id);
      if (!call) {
        throw new Error(`Factory call not found: ${id}`);
      }
      
      // Check for dependents
      const allCalls = manager.getAllFactoryCalls();
      const dependents = allCalls.filter((c) => 
        c.dependsOn?.includes(id)
      );
      
      if (dependents.length > 0 && !force) {
        const depList = dependents.map((c) => c.id).join(", ");
        throw new Error(
          `Cannot remove ${id}: Other factory calls depend on it (${depList}). Use force=true to remove anyway.`
        );
      }
      
      // Remove from manifest
      // If force=true, manually remove without using removeFactoryCall to avoid core's dependency check
      if (force && dependents.length > 0) {
        const manifest = manager.getManifest();
        const index = manifest.factories.findIndex((f) => f.id === id);
        if (index !== -1) {
          manifest.factories.splice(index, 1);
        }
      } else {
        manager.removeFactoryCall(id);
      }
      await manager.save();
      
      // Optionally delete file
      let fileDeleted = false;
      if (deleteFile && call.outputPath) {
        try {
          await Deno.remove(call.outputPath);
          fileDeleted = true;
        } catch {
          // File might not exist, that's okay
        }
      }
      
      // Format response
      const response = [
        `✅ Removed from manifest: ${id}`,
        "",
        `Factory: ${call.factory}`,
        `Output: ${call.outputPath}`,
      ];
      
      if (fileDeleted) {
        response.push(`File deleted: ${call.outputPath}`);
      }
      
      if (dependents.length > 0) {
        response.push("");
        response.push(`⚠️  ${dependents.length} factory calls depended on this:`);
        dependents.forEach((c) => response.push(`  - ${c.id}`));
      }
      
      return {
        content: [
          {
            type: "text",
            text: response.join("\n"),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `❌ Error: ${message}`,
          },
        ],
        isError: true,
      };
    }
  },
};
