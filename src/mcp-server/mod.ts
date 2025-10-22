/**
 * CodeFactory MCP Server
 * 
 * Model Context Protocol server for AI code generation with CodeFactory.
 * Uses extraction-based workflow where code is the source of truth.
 * 
 * @module
 */

export { createTool } from "./tools/create.ts";
export { syncTool } from "./tools/sync.ts";

export { loadRegistry, getFactoriesDir } from "./utils/factory-registry.ts";

export type { MCPTool, MCPToolResult } from "./types.ts";
