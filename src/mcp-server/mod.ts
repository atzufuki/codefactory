/**
 * CodeFactory MCP Server
 * 
 * Model Context Protocol server for AI code generation with CodeFactory.
 * 
 * @module
 */

export { addTool } from "./tools/add.ts";
export { produceTool } from "./tools/produce.ts";
export { updateTool } from "./tools/update.ts";
export { removeTool } from "./tools/remove.ts";
export { inspectTool } from "./tools/inspect.ts";

export { loadManifest, getManifestPath } from "./utils/manifest-loader.ts";
export { loadRegistry, getFactoriesDir } from "./utils/factory-registry.ts";

export type { MCPTool, MCPToolResult, FactoryCall } from "./types.ts";
