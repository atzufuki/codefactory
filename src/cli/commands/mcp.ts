import type { Args } from "@std/cli/parse-args";

export async function mcpCommand(_args: Args): Promise<number> {
  console.error("Starting CodeFactory MCP Server...");
  
  // Import and run the MCP server
  // The server script is self-contained and handles stdio communication
  const serverPath = new URL("../../mcp-server/server.ts", import.meta.url).pathname;
  
  // Replace current process with the server
  // This ensures proper stdio handling
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      serverPath,
    ],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const process = command.spawn();
  const status = await process.status;
  
  return status.code;
}
