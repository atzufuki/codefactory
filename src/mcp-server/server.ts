#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env
/**
 * CodeFactory MCP Server
 * 
 * Model Context Protocol server that provides tools for AI assistants
 * to interact with the CodeFactory manifest system.
 * 
 * This allows AI assistants to:
 * - Add factory calls to manifest (/codefactory.add)
 * - Build code from manifest (/codefactory.produce)
 * - Update factory calls (/codefactory.update)
 * - Remove factory calls (/codefactory.remove)
 * - Inspect manifest contents (/codefactory.inspect)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { addTool } from "./tools/add.ts";
import { produceTool } from "./tools/produce.ts";
import { updateTool } from "./tools/update.ts";
import { removeTool } from "./tools/remove.ts";
import { inspectTool } from "./tools/inspect.ts";

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
    },
  }
);

/**
 * Register all available tools
 */
const tools = [
  addTool,
  produceTool,
  updateTool,
  removeTool,
  inspectTool,
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
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("CodeFactory MCP Server running on stdio");
  console.error("Available tools:", tools.map((t) => t.name).join(", "));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  Deno.exit(1);
});
