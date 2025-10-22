/**
 * codefactory_create tool
 * 
 * Creates a new file using a factory with markers for extraction-based sync.
 * Maps to /codefactory.create command.
 */

import type { MCPTool, MCPToolResult } from "../types.ts";
import { loadRegistry } from "../utils/factory-registry.ts";
import { Producer } from "../../codefactory/producer.ts";

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
  
  // Default heuristics - check specific patterns before generic ones
  if (lower.includes("react")) return "react_component";
  if (lower.includes("function")) return "typescript_function";
  if (lower.includes("factory")) return "factory";
  if (lower.includes("component") || lower.includes("web component")) return "web_component";
  
  // Default to first available factory
  return availableFactories[0] ?? "unknown";
}

/**
 * Extract parameters from description
 */
function extractParams(description: string, factory: string): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  
  if (factory === "web_component") {
    // Extract component name
    const match = description.match(/(?:a|an|the)\s+(\w+)/i);
    if (match) {
      const name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      params.componentName = name;
      params.tagName = `app-${name.toLowerCase()}`;
    }
    
    // Extract props
    const propsMatch = description.match(/with\s+(.+?)\s+prop/i);
    if (propsMatch) {
      const propNames = propsMatch[1].split(/\s+and\s+|\s*,\s*/);
      params.props = propNames.map((p) => `${p.trim()}: unknown`);
    } else {
      params.props = [];
    }
    
    // Extract signals
    const signalsMatch = description.match(/(?:with|has)\s+(.+?)\s+signal/i);
    if (signalsMatch) {
      const signalNames = signalsMatch[1].split(/\s+and\s+|\s*,\s*/);
      params.signals = signalNames.map((s) => ({
        name: s.trim(),
        type: "unknown",
        default: "null",
      }));
    } else {
      params.signals = [];
    }
  } else if (factory === "react_component") {
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
    // Meta-factory parameters - extract factory name from various patterns
    let factoryName = "";
    let factoryDesc = "";
    
    // Try: "web component factory"
    const patternMatch = description.match(/^(.+?)\s+factory$/i);
    if (patternMatch) {
      factoryName = patternMatch[1].toLowerCase().replace(/\s+/g, "_");
      factoryDesc = `Creates ${patternMatch[1]}`;
    }
    
    // Try: "factory for web components"
    if (!factoryName) {
      const forMatch = description.match(/factory\s+for\s+(.+?)(?:\s+with|\s*$)/i);
      if (forMatch) {
        factoryName = forMatch[1].toLowerCase().replace(/\s+/g, "_");
        factoryDesc = `Creates ${forMatch[1]}`;
      }
    }
    
    // Try: "'web_component' factory"
    if (!factoryName) {
      const quotedMatch = description.match(/['"]([^'"]+)['"]\s+factory/i);
      if (quotedMatch) {
        factoryName = quotedMatch[1];
        factoryDesc = `Creates ${quotedMatch[1].replace(/_/g, " ")}`;
      }
    }
    
    if (factoryName) {
      params.name = factoryName;
      params.description = factoryDesc;
      params.template = `// TODO: Implement template for ${factoryName}`;
    }
  }
  
  return params;
}

/**
 * Generate output path from parameters
 */
function generateOutputPath(factory: string, params: Record<string, unknown>): string {
  if (factory === "web_component" && params.componentName) {
    return `src/components/${params.componentName}.ts`;
  } else if (factory === "react_component" && params.componentName) {
    return `src/components/${params.componentName}.tsx`;
  } else if (factory === "factory" && params.name) {
    return `factories/${params.name}.hbs`;
  }
  
  return `src/${factory}-output.ts`;
}

export const createTool: MCPTool = {
  name: "codefactory_create",
  description: "Create a new file using a factory (extraction-based workflow)",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "Natural language description of what to create",
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
        description: "Optional: Where to generate the file",
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
      // Load registry
      const registry = await loadRegistry(
        args.factoriesPath as string | undefined
      );
      const availableFactories = registry.list().map((f) => f.name);
      
      // Infer missing parameters
      const factory = (args.factory as string) ?? 
        (description ? inferFactory(description, availableFactories) : "");
      
      if (!factory) {
        // List all available factories with their parameters
        const catalog = registry.getCatalog();
        const factoryList = catalog.map(meta => {
          const paramList = Object.entries(meta.params)
            .map(([name, def]) => {
              const paramDef = def as Record<string, unknown>;
              return `${name}: ${paramDef.type || 'unknown'}${paramDef.required ? ' (required)' : ''}`;
            })
            .join(", ");
          return `  - ${meta.name}: ${meta.description}\n    Parameters: ${paramList || 'none'}`;
        }).join("\n");
        
        return {
          content: [{
            type: "text",
            text: "❌ Error: Could not infer factory from description.\n\n" + 
              "Available factories:\n" + factoryList,
          }],
          isError: true,
        };
      }
      
      // Validate factory exists
      const factoryObj = registry.get(factory);
      if (!factoryObj) {
        // Show available factories with parameters
        const catalog = registry.getCatalog();
        const factoryList = catalog.map(meta => {
          const paramList = Object.entries(meta.params)
            .map(([name, def]) => {
              const paramDef = def as Record<string, unknown>;
              return `${name}: ${paramDef.type || 'unknown'}${paramDef.required ? ' (required)' : ''}`;
            })
            .join(", ");
          return `  - ${meta.name}: ${meta.description}\n    Parameters: ${paramList || 'none'}`;
        }).join("\n");
        
        return {
          content: [{
            type: "text",
            text: `❌ Error: Factory '${factory}' not found.\n\nAvailable factories:\n${factoryList}`,
          }],
          isError: true,
        };
      }
      
      // Get params from args or extract from description
      const hasParams = args.params && 
        typeof args.params === "object" && 
        Object.keys(args.params).length > 0;
      
      const params = hasParams
        ? (args.params as Record<string, unknown>)
        : (description ? extractParams(description, factory) : {});
      
      // Validate required parameters
      const metadata = factoryObj.getMetadata();
      const missingParams: string[] = [];
      
      for (const [paramName, paramDef] of Object.entries(metadata.params)) {
        const def = paramDef as Record<string, unknown>;
        if (def.required && !(paramName in params)) {
          missingParams.push(`${paramName} (${def.description || 'no description'})`);
        }
      }
      
      if (missingParams.length > 0) {
        return {
          content: [{
            type: "text",
            text: `❌ Error: Missing required parameters for factory '${factory}':\n\n` +
              missingParams.map(p => `  - ${p}`).join("\n") + "\n\n" +
              `Expected parameters:\n` +
              Object.entries(metadata.params)
                .map(([name, def]) => {
                  const paramDef = def as Record<string, unknown>;
                  return `  - ${name}: ${paramDef.type || 'unknown'}${paramDef.required ? ' (required)' : ' (optional)'}\n    ${paramDef.description || 'No description'}`;
                })
                .join("\n"),
          }],
          isError: true,
        };
      }
      
      // Determine output path
      const outputPath = (args.outputPath as string) ?? generateOutputPath(factory, params);
      
      // Check if file already exists
      try {
        await Deno.stat(outputPath);
        return {
          content: [{
            type: "text",
            text: `❌ Error: File ${outputPath} already exists\n\n` +
              `Options:\n` +
              `  1. Delete the file first\n` +
              `  2. Use a different output path\n` +
              `  3. Use /codefactory.sync to update existing file`,
          }],
          isError: true,
        };
      } catch {
        // File doesn't exist - good!
      }
      
      // Create producer and generate file
      const producer = new Producer(registry);
      await producer.createFile(factory, params, outputPath);
      
      // Format response
      const response = [
        `✅ Created ${outputPath}`,
        "",
        `Factory: ${factory}`,
        "Parameters:",
        ...Object.entries(params).map(([key, value]) => 
          `  - ${key}: ${JSON.stringify(value)}`
        ),
        "",
        "📝 You can now:",
        "  1. Edit the file directly (add signals, change props)",
        "  2. Add custom code below // @codefactory:end marker",
        "  3. Run /codefactory.sync to regenerate factory sections",
        "",
        "💡 Your code is the source of truth",
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
