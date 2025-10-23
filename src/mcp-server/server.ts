#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env
/**
 * CodeFactory MCP Server
 * 
 * Model Context Protocol server that provides tools for AI assistants
 * to interact with the CodeFactory extraction-based system.
 * 
 * This allows AI assistants to:
 * - Create new files from factories (/codefactory.create)
 * - Sync generated code with templates (/codefactory.sync)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { createTool } from "./tools/create.ts";
import { syncTool } from "./tools/sync.ts";
import { loadRegistry } from "./utils/factory-registry.ts";

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: "codefactory-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

/**
 * Register all available tools
 */
const tools = [
  createTool,
  syncTool,
];

/**
 * Handle tool list requests
 */
server.setRequestHandler(ListToolsRequestSchema, () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

/**
 * Handle resource list requests - show available factories
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  try {
    const registry = await loadRegistry();
    const catalog = registry.getCatalog();
    
    return {
      resources: catalog.map((factory) => ({
        uri: `codefactory://factory/${factory.name}`,
        mimeType: "application/json",
        name: `Factory: ${factory.name}`,
        description: factory.description,
      })),
    };
  } catch (error) {
    console.error("Failed to load factory catalog:", error);
    return { resources: [] };
  }
});

/**
 * Handle resource read requests - show factory details
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const match = uri.match(/^codefactory:\/\/factory\/(.+)$/);
  
  if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }
  
  const factoryName = match[1];
  
  try {
    const registry = await loadRegistry();
    const factory = registry.get(factoryName);
    
    if (!factory) {
      throw new Error(`Factory not found: ${factoryName}`);
    }
    
    const metadata = factory.getMetadata();
    const details = {
      name: metadata.name,
      description: metadata.description,
      parameters: Object.entries(metadata.params).map(([name, def]) => {
        const paramDef = def as Record<string, unknown>;
        return {
          name,
          type: paramDef.type || "unknown",
          required: paramDef.required || false,
          description: paramDef.description || "No description",
        };
      }),
      examples: metadata.examples || [],
    };
    
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(details, null, 2),
      }],
    };
  } catch (error) {
    throw new Error(`Failed to read factory ${factoryName}: ${error instanceof Error ? error.message : String(error)}`);
  }
});

/**
 * Handle tool execution requests
 */
// @ts-expect-error - MCP SDK type definitions are complex, but our response format is correct
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const tool = tools.find((t) => t.name === toolName);

  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  try {
    const result = await tool.execute(request.params.arguments ?? {});
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the MCP server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("CodeFactory MCP Server running on stdio");
  console.error("Available tools:", tools.map((t) => t.name).join(", "));
  console.error("Press Ctrl+C to stop");
  
  // Keep the server running - it will exit when stdin closes
  await new Promise(() => {}); // Never resolves, keeps process alive
}

/**
 * Export for programmatic use (e.g., from CLI)
 */
export async function runMcpServer() {
  await main();
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    Deno.exit(1);
  });
}
