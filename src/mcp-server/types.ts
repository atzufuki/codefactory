/**
 * Type definitions for MCP tools
 */

/**
 * Base interface for MCP tool definitions
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (args: Record<string, unknown>) => Promise<MCPToolResult>;
}

/**
 * Result returned by MCP tool execution
 */
export interface MCPToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}
