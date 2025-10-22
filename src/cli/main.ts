import { parseArgs } from "@std/cli/parse-args";
import { initCommand } from "./commands/init.ts";
import { listCommand } from "./commands/list.ts";
import { createCommand } from "./commands/create.ts";
import { syncCommand } from "./commands/sync.ts";
import { validateCommand } from "./commands/validate.ts";
import { mcpCommand } from "./commands/mcp.ts";

const VERSION = "0.1.0";

function showHelp() {
  console.log(`
codefactory v${VERSION} - Extraction-based code generation

USAGE:
  codefactory <command> [options]

COMMANDS:
  init [directory]           Initialize a codefactory project
  list                       List all available factories
  create <factory> [options] Create a file from a factory
  sync <path>                Sync files with their factories
  validate                   Validate all factory templates
  mcp                        Start MCP server for AI assistants
  help                       Show this help message
  version                    Show version

OPTIONS:
  --help, -h                 Show help for a command

EXAMPLES:
  codefactory init
  codefactory list
  codefactory create react_component --params '{"name":"Button"}' --output src/Button.tsx
  codefactory sync src/components
  codefactory validate
  codefactory mcp

For more information, visit: https://github.com/atzufuki/codefactory
`);
}

function showVersion() {
  console.log(`codefactory v${VERSION}`);
}

async function main() {
  const args = parseArgs(Deno.args, {
    boolean: ["help", "h", "version", "v"],
    string: ["params", "output"],
    alias: { h: "help", v: "version" },
  });

  const command = args._[0]?.toString();

  // Handle global flags
  if (args.version || args.v) {
    showVersion();
    Deno.exit(0);
  }

  if (args.help || args.h || !command) {
    showHelp();
    Deno.exit(command ? 0 : 1);
  }

  // Route to command handlers
  try {
    let exitCode = 0;
    
    switch (command) {
      case "init":
        exitCode = await initCommand(args);
        break;
      case "list":
        exitCode = await listCommand(args);
        break;
      case "create":
        exitCode = await createCommand(args);
        break;
      case "sync":
        exitCode = await syncCommand(args);
        break;
      case "validate":
        exitCode = await validateCommand(args);
        break;
      case "mcp":
        exitCode = await mcpCommand(args);
        break;
      case "help":
        showHelp();
        break;
      case "version":
        showVersion();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "codefactory help" for usage information.');
        exitCode = 1;
    }
    
    Deno.exit(exitCode);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
