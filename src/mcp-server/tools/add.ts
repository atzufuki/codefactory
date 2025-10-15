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
    // Meta-factory parameters - need to be complete!
    const match = description.match(/for\s+(.+?)(?:\s+with|\s*$)/i);
    if (match) {
      const targetName = match[1];
      params.name = targetName.toLowerCase().replace(/\s+/g, "_");
      params.description = `Creates ${targetName}`;
      
      // Generate a basic template based on the target
      // This is a minimal template - user should customize it
      params.template = `---
name: {{name}}
description: {{description}}
outputPath: "src/{{name}}.ts"
---
// Generated code for {{name}}
export const {{name}} = {
  // TODO: Implement
};`;
      
      params.outputPath = `factories/${params.name}.hbs`;
    }
  }
  
  return params;
}

/**
 * Map user-provided params to correct meta-factory parameter names
 */
function mapMetaFactoryParams(userParams: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  
  // Handle different naming conventions
  mapped.name = userParams.name || userParams.factoryName;
  mapped.description = userParams.description || userParams.factoryDescription;
  mapped.template = userParams.template;
  mapped.outputPath = userParams.outputPath;
  
  // Convert parameters array to paramDescriptions if needed
  if (userParams.parameters && Array.isArray(userParams.parameters)) {
    mapped.paramDescriptions = userParams.parameters.reduce((acc: Record<string, string>, param: unknown) => {
      if (typeof param === 'string') {
        acc[param] = `Parameter: ${param}`;
      } else if (param && typeof param === 'object' && 'name' in param) {
        const p = param as { name: string; description?: string };
        acc[p.name] = p.description || `Parameter: ${p.name}`;
      }
      return acc;
    }, {});
  } else if (userParams.paramDescriptions) {
    mapped.paramDescriptions = userParams.paramDescriptions;
  }
  
  // Validate required fields for meta-factory
  if (!mapped.name) {
    throw new Error("Meta-factory 'factory' requires 'name' parameter");
  }
  if (!mapped.description) {
    throw new Error("Meta-factory 'factory' requires 'description' parameter");
  }
  if (!mapped.template) {
    throw new Error("Meta-factory 'factory' requires 'template' parameter. Please provide the code template with {{variable}} placeholders.");
  }
  
  return mapped;
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
      manifestPath: {
        type: "string",
        description: "Optional: Path to manifest file",
      },
      factoriesPath: {
        type: "string",
        description: "Optional: Path to factories directory",
      },
    },
    required: [],
  },

  async execute(args: Record<string, unknown>): Promise<MCPToolResult> {
    const description = args.description as string | undefined;
    
    // Require either description or factory + params
    if (!description && !args.factory) {
      return {
        content: [{
          type: "text",
          text: "❌ Error: Either 'description' or 'factory' parameter is required",
        }],
        isError: true,
      };
    }
    
    try {
      // Load manifest and registry
      const manager = await loadManifest(args.manifestPath as string | undefined);
      const registry = await loadRegistry(
        args.factoriesPath as string | undefined,
        "*.hbs" // Load only .hbs template files
      );
      const availableFactories = registry.list().map((f) => f.name);
      
      // Infer missing parameters
      const factory = (args.factory as string) ?? 
        (description ? inferFactory(description, availableFactories) : "");
      
      if (!factory) {
        return {
          content: [{
            type: "text",
            text: "❌ Error: Could not infer factory from description. Available factories: " + 
              availableFactories.join(", "),
          }],
          isError: true,
        };
      }
      
      // Validate factory exists
      const factoryObj = registry.get(factory);
      if (!factoryObj) {
        return {
          content: [{
            type: "text",
            text: `❌ Error: Factory '${factory}' not found. Available: ${availableFactories.join(", ")}`,
          }],
          isError: true,
        };
      }
      
      const id = (args.id as string) ?? generateId(description ?? factory, factory);
      
      // Get params from args or extract from description
      // Check if args.params is empty object - if so, use extractParams
      const hasParams = args.params && 
        typeof args.params === "object" && 
        Object.keys(args.params).length > 0;
      
      let params = hasParams
        ? (args.params as Record<string, unknown>)
        : (description ? extractParams(description, factory) : {});
      
      // Special handling for meta-factory: map parameter names correctly
      if (factory === "factory" && Object.keys(params).length > 0) {
        params = mapMetaFactoryParams(params);
      }
      
      // Check for duplicate ID
      const existing = manager.getAllFactoryCalls().find(call => call.id === id);
      if (existing) {
        return {
          content: [{
            type: "text",
            text: `❌ Error: Factory call with ID '${id}' already exists in manifest`,
          }],
          isError: true,
        };
      }
      
      const outputPath = (args.outputPath as string) ?? `src/${id}.ts`;
      
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
