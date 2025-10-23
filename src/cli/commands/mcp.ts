import type { Args } from "@std/cli/parse-args";

export async function mcpCommand(_args: Args): Promise<number> {
  // Import and run MCP server directly (works in both dev and compiled binary)
  const { runMcpServer } = await import("../../mcp-server/server.ts");
  await runMcpServer();
  return 0;
}
