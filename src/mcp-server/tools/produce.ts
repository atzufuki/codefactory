/**
 * codefactory_produce tool
 * 
 * Builds code from manifest (deterministic execution phase).
 * Maps to /codefactory.produce command.
 */

import type { MCPTool, MCPToolResult } from "../types.ts";
import { Producer } from "@codefactory/core";
import { loadManifest } from "../utils/manifest-loader.ts";
import { loadRegistry } from "../utils/factory-registry.ts";

export const produceTool: MCPTool = {
  name: "codefactory_produce",
  description: "Build code from manifest (deterministic execution)",
  inputSchema: {
    type: "object",
    properties: {
      ids: {
        type: "array",
        description: "Optional: specific factory call IDs to build",
        items: { type: "string" },
      },
      dryRun: {
        type: "boolean",
        description: "Preview what would be generated without writing files",
      },
    },
  },

  async execute(args: Record<string, unknown>): Promise<MCPToolResult> {
    try {
      // Load manifest and registry
      const manager = await loadManifest();
      const registry = await loadRegistry();
      
      // Create producer
      const producer = new Producer(manager.getManifest(), registry);
      
      // Check if dry run
      const dryRun = args.dryRun as boolean ?? false;
      const ids = args.ids as string[] | undefined;
      
      if (dryRun) {
        const preview = await producer.dryRun();
        
        const response = [
          "🔍 Dry run preview:",
          "",
          `Will generate ${preview.willGenerate.length} files:`,
          ...preview.willGenerate.map((file) => {
            const isNew = preview.willCreate.includes(file);
            const isUpdate = preview.willUpdate.includes(file);
            const icon = isNew ? "➕" : isUpdate ? "🔄" : "📝";
            return `  ${icon} ${file}`;
          }),
        ];
        
        if (preview.errors.length > 0) {
          response.push("", `⚠️  ${preview.errors.length} errors:`);
          preview.errors.forEach((err) => response.push(`  ❌ ${err}`));
        }
        
        return {
          content: [
            {
              type: "text",
              text: response.join("\n"),
            },
          ],
        };
      }
      
      // Execute build
      const startTime = Date.now();
      const result = ids ? await producer.build(ids) : await producer.buildAll();
      const duration = Date.now() - startTime;
      
      if (result.success) {
        const response = [
          "✅ Build completed successfully",
          "",
          `Generated ${result.generated.length} files:`,
          ...result.generated.map((file) => `  ✓ ${file}`),
          "",
          `⏱️  Completed in ${duration}ms`,
        ];
        
        return {
          content: [
            {
              type: "text",
              text: response.join("\n"),
            },
          ],
        };
      } else {
        const response = [
          `❌ Build failed with ${result.errors.length} errors:`,
          "",
          ...result.errors.map((err) => 
            `  • ${err.factoryCallId}: ${err.error}`
          ),
        ];
        
        return {
          content: [
            {
              type: "text",
              text: response.join("\n"),
            },
          ],
          isError: true,
        };
      }
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
