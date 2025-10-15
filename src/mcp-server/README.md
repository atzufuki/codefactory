# CodeFactory MCP Server

> Model Context Protocol server for AI-powered code generation with CodeFactory

## What is This?

An MCP (Model Context Protocol) server that allows AI assistants like Claude Desktop to interact directly with the CodeFactory manifest system through native tools instead of generating and executing TypeScript code.

## Features

✅ **5 MCP Tools** mapping to Copilot commands:
- `codefactory_add` - Add factory calls to manifest (/codefactory.add)
- `codefactory_produce` - Build code from manifest (/codefactory.produce)
- `codefactory_update` - Update factory calls (/codefactory.update)
- `codefactory_remove` - Remove factory calls (/codefactory.remove)
- `codefactory_inspect` - Inspect manifest contents (/codefactory.inspect)

✅ **AI Inference** - Automatically infers factory names and parameters from descriptions

✅ **Type Safe** - Built with TypeScript and Deno 2

✅ **Standards Compliant** - Follows MCP specification

## Installation

### For Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "codefactory": {
      "command": "deno",
      "args": [
        "run",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "/path/to/codefactory/src/mcp-server/server.ts"
      ],
      "env": {
        "CODEFACTORY_MANIFEST": "./codefactory.manifest.json",
        "CODEFACTORY_FACTORIES_DIR": "./factories"
      }
    }
  }
}
```

### For Other MCP Clients

The server uses stdio transport and can be integrated with any MCP-compatible client.

## Usage

Once configured, AI assistants can use the tools directly:

**User:** "Add a Button component to the manifest"

**AI uses:** `codefactory_add({ description: "a Button component with label and onClick props" })`

**Result:** Factory call added to `codefactory.manifest.json`

---

**User:** "Build the project"

**AI uses:** `codefactory_produce({})`

**Result:** Code generated from manifest

## Environment Variables

- `CODEFACTORY_MANIFEST` - Path to manifest file (default: `./codefactory.manifest.json`)
- `CODEFACTORY_FACTORIES_DIR` - Path to factories directory (default: `./factories`)

## Development

```bash
# Run server
deno task dev

# Type check
deno check server.ts
```

## Architecture

```
mcp-server/
├── server.ts              # MCP server entry point
├── tools/                 # Tool implementations
│   ├── add.ts            # codefactory_add
│   ├── produce.ts        # codefactory_produce
│   ├── update.ts         # codefactory_update
│   ├── remove.ts         # codefactory_remove
│   └── inspect.ts        # codefactory_inspect
├── utils/                # Utilities
│   ├── manifest-loader.ts
│   └── factory-registry.ts
├── types.ts              # Type definitions
└── mod.ts                # Public exports
```

## Benefits Over Copilot Prompts

| Aspect | Copilot Prompts | MCP Server |
|--------|----------------|------------|
| **Execution** | AI generates TS → Run in terminal | Direct tool calls |
| **Type Safety** | None (free-form code) | Schema-validated |
| **Error Handling** | Inconsistent | Standardized |
| **Speed** | Slower (code generation) | Faster (direct) |
| **Reliability** | Can generate wrong code | Always correct API calls |

## Related

- [CodeFactory Core](../codefactory/) - Core library
- [GitHub Issue #8](https://github.com/atzufuki/codefactory/issues/8) - MCP server spec
- [MCP Specification](https://modelcontextprotocol.io/)

---

**Built with Deno 🦕 and MCP 🔌**
