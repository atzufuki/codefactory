/**
 * codefactory_inspect tool
 * 
 * Shows manifest contents, dependency graph, and build status.
 * Maps to /codefactory.inspect command.
 */

import type { MCPTool, MCPToolResult } from "../types.ts";
import { loadManifest } from "../utils/manifest-loader.ts";

/**
 * Build a simple dependency graph visualization
 */
function buildDependencyGraph(calls: Array<{ id: string; dependsOn?: string[] }>): string {
  const lines: string[] = [];
  const processed = new Set<string>();
  
  function addNode(id: string, indent = 0) {
    if (processed.has(id)) return;
    processed.add(id);
    
    lines.push("  ".repeat(indent) + (indent > 0 ? "↳ " : "") + id);
    
    // Find calls that depend on this one
    const children = calls.filter((c) => c.dependsOn?.includes(id));
    for (const child of children) {
      addNode(child.id, indent + 1);
    }
  }
  
  // Start with root nodes (no dependencies)
  const roots = calls.filter((c) => !c.dependsOn || c.dependsOn.length === 0);
  for (const root of roots) {
    addNode(root.id);
  }
  
  return lines.join("\n");
}

export const inspectTool: MCPTool = {
  name: "codefactory_inspect",
  description: "Show manifest contents, dependency graph, and build status",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Optional: Show detailed view of specific factory call",
      },
      showGraph: {
        type: "boolean",
        description: "Include dependency graph visualization",
      },
      showStats: {
        type: "boolean",
        description: "Include project statistics",
      },
      manifestPath: {
        type: "string",
        description: "Optional: Custom path to manifest file (for testing)",
      },
    },
  },

  async execute(args: Record<string, unknown>): Promise<MCPToolResult> {
    const id = args.id as string | undefined;
    const showGraph = args.showGraph as boolean ?? true;
    const showStats = args.showStats as boolean ?? true;
    
    try {
      const manager = await loadManifest(args.manifestPath as string | undefined);
      const manifest = manager.getManifest();
      const calls = manager.getAllFactoryCalls();
      
      // If specific ID requested, show detailed view
      if (id) {
        const call = calls.find((c) => c.id === id);
        if (!call) {
          throw new Error(`Factory call not found: ${id}`);
        }
        
        const response = [
          `📋 Factory Call: ${id}`,
          "",
          `Factory: ${call.factory}`,
          `Output: ${call.outputPath}`,
          `Created: ${call.createdAt}`,
          "",
          "Parameters:",
          ...Object.entries(call.params).map(([key, value]) => 
            `  ${key}: ${JSON.stringify(value)}`
          ),
        ];
        
        if (call.dependsOn && call.dependsOn.length > 0) {
          response.push("", "Dependencies:");
          call.dependsOn.forEach((dep) => response.push(`  - ${dep}`));
        }
        
        // Check file status
        try {
          await Deno.stat(call.outputPath);
          response.push("", "✅ File exists");
        } catch {
          response.push("", "❌ File not generated yet");
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
      
      // Overview mode
      const response = [
        `📋 Manifest Overview`,
        "",
        `Version: ${manifest.version}`,
        `Last generated: ${manifest.generated ?? "never"}`,
        `Total factory calls: ${calls.length}`,
      ];
      
      // List all calls
      if (calls.length > 0) {
        response.push("", "Factory Calls:");
        for (const call of calls) {
          const deps = call.dependsOn && call.dependsOn.length > 0 
            ? ` (depends on: ${call.dependsOn.join(", ")})` 
            : "";
          response.push(`  • ${call.id}: ${call.factory}${deps}`);
        }
      }
      
      // Dependency graph
      if (showGraph && calls.length > 0) {
        response.push("", "Dependency Graph:");
        response.push(buildDependencyGraph(calls));
      }
      
      // Statistics
      if (showStats) {
        const executionOrder = manager.getExecutionOrder();
        response.push("", "Build Order:");
        executionOrder.forEach((call, i) => {
          response.push(`  ${i + 1}. ${call.id}`);
        });
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
