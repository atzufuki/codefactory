# CodeFactory MCP Server

> Model Context Protocol server for AI-powered code generation with CodeFactory

## What is This?

An MCP (Model Context Protocol) server that allows AI assistants like Claude Desktop to interact directly with the CodeFactory extraction-based system through native tools instead of generating and executing TypeScript code.

## Features

✅ **2 MCP Tools** mapping to Copilot commands:
- `codefactory_create` - Create new files from factories (/codefactory.create)
- `codefactory_sync` - Synchronize edited code with factories (/codefactory.sync)

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

**User:** "Create a Button component"

**AI uses:** `codefactory_create({ factory: "react_component", outputPath: "src/components/Button.tsx", params: { ... } })`

**Result:** File created with extraction markers

---

**User:** "Sync my changes"

**AI uses:** `codefactory_sync({ path: "src/components" })`

**Result:** All edited files synchronized with their factories

## Environment Variables

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
│   ├── create.ts         # codefactory_create
│   └── sync.ts           # codefactory_sync
├── utils/                # Utilities
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
