/**
 * codefactory_add tool
 * 
 * Adds a factory call to the manifest (planning phase).
 * Maps to /codefactory.add command.
 */

import type { MCPTool, MCPToolResult } from "../types.ts";
import { loadManifest } from "../utils/manifest-loader.ts";
import { loadRegistry } from "../utils/factory-registry.ts";

/**
 * Generate a kebab-case ID from a description
 */
function generateId(description: string, factory: string): string {
  // Try to extract a name from the description
  const match = description.match(/(?:a|an|the)\s+(\w+)/i);
  const name = match ? match[1] : factory;
  
  return `${name.toLowerCase()}-component`;
}

/**
 * Infer factory name from description
 */
function inferFactory(description: string, availableFactories: string[]): string {
  const lower = description.toLowerCase();
  
  // Check if description mentions a factory by name
  for (const factory of availableFactories) {
    if (lower.includes(`'${factory}'`) || lower.includes(`"${factory}"`)) {
      return factory;
    }
  }
  
  // Default heuristics
  if (lower.includes("component")) return "react_component";
  if (lower.includes("function")) return "typescript_function";
  if (lower.includes("factory")) return "factory";
  
  // Default to first available factory
  return availableFactories[0] ?? "unknown";
}

/**
 * Extract parameters from description
 */
function extractParams(description: string, factory: string): Record<string, unknown> {
  // This is a simplified version - real implementation would use AI or more sophisticated parsing
  const params: Record<string, unknown> = {};
  
  if (factory === "react_component") {
    // Extract component name
    const match = description.match(/(?:a|an|the)\s+(\w+)/i);
    if (match) {
      params.componentName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    }
    
    // Extract props
    const propsMatch = description.match(/with\s+(.+?)\s+prop/i);
    if (propsMatch) {
      const propNames = propsMatch[1].split(/\s+and\s+|\s*,\s*/);
      params.props = propNames.map((p) => `${p.trim()}: unknown`);
    }
  } else if (factory === "factory") {
    // Meta-factory parameters
    const match = description.match(/for\s+(.+?)(?:\s+with|\s*$)/i);
    if (match) {
      params.name = match[1].toLowerCase().replace(/\s+/g, "_");
      params.description = `Creates ${match[1]}`;
      params.template = "// Template placeholder";
    }
  }
  
  return params;
}

export const addTool: MCPTool = {
  name: "codefactory_add",
  description: "Add a factory call to the manifest (planning phase)",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "Natural language description of what to create",
      },
      id: {
        type: "string",
        description: "Optional: Unique identifier (kebab-case)",
      },
      factory: {
        type: "string",
        description: "Optional: Factory name to use",
      },
      params: {
        type: "object",
        description: "Optional: Parameters to pass to the factory",
      },
      outputPath: {
        type: "string",
        description: "Optional: Where to generate the code",
      },
      dependsOn: {
        type: "array",
        description: "Optional: IDs this factory call depends on",
        items: { type: "string" },
      },
    },
    required: ["description"],
  },

  async execute(args: Record<string, unknown>): Promise<MCPToolResult> {
    const description = args.description as string;
    
    try {
      // Load manifest and registry
      const manager = await loadManifest();
      const registry = await loadRegistry();
      const availableFactories = registry.list().map((f) => f.name);
      
      // Infer missing parameters
      const factory = (args.factory as string) ?? inferFactory(description, availableFactories);
      const id = (args.id as string) ?? generateId(description, factory);
      const params = (args.params as Record<string, unknown>) ?? extractParams(description, factory);
      
      // Get factory to determine output path if not provided
      const factoryObj = registry.get(factory);
      const outputPath = (args.outputPath as string) ?? 
        (factoryObj ? `src/${id}.ts` : `src/${id}.ts`);
      
      // Add to manifest
      manager.addFactoryCall({
        id,
        factory,
        params,
        outputPath,
        dependsOn: (args.dependsOn as string[]) ?? [],
      });
      
      await manager.save();
      
      // Format response
      const response = [
        `✅ Added to manifest: ${id}`,
        "",
        `Factory: ${factory}`,
        `Output: ${outputPath}`,
        "",
        "Parameters:",
        ...Object.entries(params).map(([key, value]) => 
          `  - ${key}: ${JSON.stringify(value)}`
        ),
        "",
        "📝 Run /codefactory.produce to generate the code",
      ].join("\n");
      
      return {
        content: [
          {
            type: "text",
            text: response,
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
