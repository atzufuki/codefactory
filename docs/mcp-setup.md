# MCP Server Setup Guide

This project uses the **Model Context Protocol (MCP)** to provide Copilot commands for manifest operations.

## What is MCP?

MCP allows AI assistants like GitHub Copilot to use external tools (like our codefactory server) to perform operations. Instead of Copilot generating TypeScript code to manipulate the manifest, it calls our MCP tools directly.

**Benefits:**
- ✅ More reliable (deterministic operations)
- ✅ Consistent behavior across all uses
- ✅ Better error handling
- ✅ No code generation needed for manifest operations

## Setup Instructions

### 1. Install MCP Support in Your IDE

**For VS Code with GitHub Copilot:**

The MCP server configuration should be added to your Copilot settings.

Create or edit `.vscode/settings.json`:

```json
{
  "github.copilot.chat.tools": {
    "codefactory": {
      "enabled": true,
      "provider": "mcp",
      "command": "deno",
      "args": [
        "task",
        "mcp:dev"
      ],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### 2. Verify MCP Server Task Exists

The template project includes the MCP server task in `deno.json`:

```json
{
  "tasks": {
    "mcp:dev": "deno run --allow-read --allow-write --allow-env jsr:@codefactory/mcp-server"
  }
}
```

This task starts the MCP server that provides the codefactory tools.

### 3. Test MCP Connection

1. Open GitHub Copilot Chat in your IDE
2. Type `/codefactory.inspect`
3. If MCP is configured correctly, you should see your manifest contents

If you get an error like "Tool not found", the MCP server isn't running or isn't configured properly.

### 4. Manual Server Start (Optional)

You can also start the MCP server manually for debugging:

```bash
deno task mcp:dev
```

This runs the server in stdio mode, which is what Copilot uses to communicate with it.

## Available MCP Tools

Once configured, these tools are available in Copilot Chat:

| Tool | Description | Example |
|------|-------------|---------|
| `codefactory_add` | Add factory call to manifest | `/codefactory.add "Button component"` |
| `codefactory_produce` | Build code from manifest | `/codefactory.produce` |
| `codefactory_update` | Update existing factory call | `/codefactory.update button-component` |
| `codefactory_remove` | Remove factory call | `/codefactory.remove button-component` |
| `codefactory_inspect` | View manifest contents | `/codefactory.inspect` |

## Troubleshooting

### "MCP tools not available"

**Solution 1: Check VS Code settings**
- Ensure `.vscode/settings.json` has the MCP configuration
- Restart VS Code after adding configuration

**Solution 2: Verify Deno is installed**
```bash
deno --version
```

**Solution 3: Test MCP server manually**
```bash
deno task mcp:dev
# Should start server without errors
# Press Ctrl+C to stop
```

### "Cannot find module '@codefactory/mcp-server'"

The MCP server is published to JSR. Ensure you have internet connection:

```bash
deno run jsr:@codefactory/mcp-server --version
```

### MCP server crashes

Check the Copilot Chat output panel for error messages:
1. Open VS Code Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Run: "Developer: Show Logs"
3. Select "GitHub Copilot Chat"
4. Look for MCP-related errors

## IDE-Specific Setup

### VS Code

Configuration via `.vscode/settings.json` (see above).

### Cursor

Cursor has built-in MCP support. Add to your user settings:

```json
{
  "mcp.servers": {
    "codefactory": {
      "command": "deno",
      "args": ["task", "mcp:dev"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### Other IDEs

MCP support varies by IDE. Check your IDE's documentation for MCP configuration.

## Advanced Configuration

### Custom MCP Server Path

If you want to use a local development version of the MCP server:

```json
{
  "tasks": {
    "mcp:dev": "deno run --allow-read --allow-write --allow-env ../path/to/local/mcp-server/mod.ts"
  }
}
```

### Environment Variables

The MCP server respects these environment variables:

- `CODEFACTORY_MANIFEST_PATH` - Custom path to manifest file (default: `./codefactory.manifest.json`)
- `CODEFACTORY_FACTORIES_PATH` - Custom path to factories directory (default: `./factories`)

Set in `.vscode/settings.json`:

```json
{
  "github.copilot.chat.tools": {
    "codefactory": {
      "enabled": true,
      "provider": "mcp",
      "command": "deno",
      "args": ["task", "mcp:dev"],
      "cwd": "${workspaceFolder}",
      "env": {
        "CODEFACTORY_MANIFEST_PATH": "./my-custom-manifest.json"
      }
    }
  }
}
```

## Learn More

- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [Codefactory Documentation](https://github.com/atzufuki/codefactory)
- [MCP Server Source Code](https://jsr.io/@codefactory/mcp-server)

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review MCP server logs
3. Open an issue on GitHub with error details
