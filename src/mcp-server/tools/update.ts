/**
 * codefactory_update tool
 * 
 * Updates an existing factory call in the manifest.
 * Maps to /codefactory.update command.
 */

import type { MCPTool, MCPToolResult } from "../types.ts";
import { loadManifest } from "../utils/manifest-loader.ts";

export const updateTool: MCPTool = {
  name: "codefactory_update",
  description: "Update an existing factory call in the manifest",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the factory call to update",
      },
      updates: {
        type: "object",
        description: "Fields to update",
        properties: {
          params: {
            type: "object",
            description: "Updated parameters",
          },
          outputPath: {
            type: "string",
            description: "Updated output path",
          },
          dependsOn: {
            type: "array",
            description: "Updated dependencies",
            items: { type: "string" },
          },
        },
      },
      manifestPath: {
        type: "string",
        description: "Optional: Path to manifest file",
      },
    },
    required: ["id", "updates"],
  },

  async execute(args: Record<string, unknown>): Promise<MCPToolResult> {
    const id = args.id as string;
    const updates = args.updates as Record<string, unknown>;
    
    try {
      const manager = await loadManifest(args.manifestPath as string | undefined);
      
      // Get current call for comparison
      const currentCall = manager.getAllFactoryCalls().find((c) => c.id === id);
      if (!currentCall) {
        throw new Error(`Factory call not found: ${id}`);
      }
      
      // Apply updates
      manager.updateFactoryCall(id, updates);
      await manager.save();
      
      // Format response
      const response = [
        `✅ Updated in manifest: ${id}`,
        "",
        "Changes:",
      ];
      
      // Show what changed
      for (const [key, value] of Object.entries(updates)) {
        const oldValue = (currentCall as unknown as Record<string, unknown>)[key];
        response.push(`  ${key}:`);
        response.push(`    Old: ${JSON.stringify(oldValue)}`);
        response.push(`    New: ${JSON.stringify(value)}`);
      }
      
      response.push("");
      response.push("📝 Run /codefactory.produce to regenerate with new parameters");
      
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
