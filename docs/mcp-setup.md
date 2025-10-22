# MCP Server Setup Guide

This project uses the **Model Context Protocol (MCP)** to provide AI assistant tools for code generation and synchronization.

## What is MCP?

MCP allows AI assistants like GitHub Copilot and Claude Desktop to use external tools (like our CodeFactory server) to perform operations. Instead of AI generating code directly, it calls our MCP tools for structured code generation.

**Benefits:**
- ✅ More reliable (deterministic operations)
- ✅ Consistent behavior across all uses
- ✅ Better error handling
- ✅ Type-safe with schema validation
- ✅ Extraction-based workflow support

## Setup Instructions

### For VS Code with GitHub Copilot (VS Code 1.99+)

Create or edit `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "codefactory": {
      "type": "stdio",
      "command": "deno",
      "args": [
        "run",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "${workspaceFolder}/path/to/mcp-server/server.ts"
      ],
      "env": {
        "CODEFACTORY_FACTORIES_DIR": "${workspaceFolder}/factories"
      }
    }
  }
}
```

**Note:** 
- VS Code will show a "Start" button next to the server configuration when you open the file. Click it to start the MCP server.

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
        "/absolute/path/to/mcp-server/server.ts"
      ],
      "env": {
        "CODEFACTORY_FACTORIES_DIR": "./factories"
      }
    }
  }
}
```

### Test MCP Connection

**For VS Code:**
1. Open `.vscode/mcp.json` in your project
2. Click the "Start" button next to the server configuration
3. Open GitHub Copilot Chat
4. Click the tools icon (🔧) to see available tools
5. You should see CodeFactory tools listed

**For Claude Desktop:**
1. Restart Claude Desktop after adding the configuration
2. In a new conversation, the tools should be available automatically
3. Type: "create a button component" to test

If you don't see the tools, check the troubleshooting section below.

## Available MCP Tools

Once configured, these tools are available in Copilot Chat:

| Tool | Description | Example |
|------|-------------|---------|
| `codefactory_create` | Create file from factory | `/codefactory.create factory="component" name="Button"` |
| `codefactory_sync` | Sync files (extract & regenerate) | `/codefactory.sync "src/components"` |

**Usage:**
- **Create**: Generate initial code from factory template
- **Sync**: Extract changes from edited code and regenerate

Your code is always the source of truth!

## Troubleshooting

### "MCP tools not available" (VS Code)

**Solution 1: Start the server**
- Open `.vscode/mcp.json`
- Click the "Start" button next to the server configuration
- Wait a few seconds for the server to initialize

**Solution 2: Check VS Code version**
```bash
code --version
# Must be 1.99 or higher for MCP support
```

**Solution 3: Verify Deno is installed**
```bash
deno --version
# Should show Deno 2.0 or higher
```

**Solution 4: Check the MCP server path**
- Ensure the path in `.vscode/mcp.json` points to the correct server.ts file
- Use absolute paths or `${workspaceFolder}` variable

### "MCP tools not available" (Claude Desktop)

**Solution 1: Check config file location**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Solution 2: Use absolute paths**
- Ensure all paths in the config are absolute
- Relative paths won't work in Claude Desktop config

**Solution 3: Restart Claude Desktop**
- Close Claude Desktop completely
- Wait a few seconds
- Restart and try again

### MCP server crashes

**For VS Code:**
1. Open Output panel (View → Output)
2. Select "MCP" from the dropdown
3. Look for error messages

**For Claude Desktop:**
1. Check the Claude Desktop logs
2. Look for MCP-related errors in the console

## IDE-Specific Setup

### VS Code (1.99+)

Use `.vscode/mcp.json`:

```json
{
  "servers": {
    "codefactory": {
      "type": "stdio",
      "command": "deno",
      "args": ["run", "--allow-read", "--allow-write", "--allow-env", "${workspaceFolder}/server.ts"],
      "env": {
        "CODEFACTORY_FACTORIES_DIR": "${workspaceFolder}/factories"
      }
    }
  }
}
```

### Claude Desktop

Use the global config file (absolute paths required):

```json
{
  "mcpServers": {
    "codefactory": {
      "command": "deno",
      "args": ["run", "--allow-read", "--allow-write", "--allow-env", "/absolute/path/to/server.ts"],
      "env": {
        "CODEFACTORY_FACTORIES_DIR": "/absolute/path/to/factories"
      }
    }
  }
}
```

### Cursor

Cursor supports MCP through `.cursor/mcp.json` or global settings. Check Cursor documentation for latest MCP support details.

### Other IDEs

MCP support is growing. Check your IDE's documentation for MCP configuration instructions.

## Advanced Configuration

### Custom Server Path

If you're developing the MCP server locally or using a custom fork:

```json
{
  "servers": {
    "codefactory": {
      "type": "stdio",
      "command": "deno",
      "args": [
        "run",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "/path/to/your/custom/mcp-server/server.ts"
      ]
    }
  }
}
```

### Environment Variables

The MCP server respects these environment variables:

- `CODEFACTORY_FACTORIES_DIR` - Path to factories directory (default: `./factories`)

Example with custom path:

```json
{
  "servers": {
    "codefactory": {
      "type": "stdio",
      "command": "deno",
      "args": ["run", "--allow-read", "--allow-write", "--allow-env", "server.ts"],
      "env": {
        "CODEFACTORY_FACTORIES_DIR": "./custom/factories"
      }
    }
  }
}
```

### Using with Multiple Projects

You can have different MCP configurations for different projects:

1. Each project has its own `.vscode/mcp.json`
2. VS Code loads the config from the current workspace
3. No conflicts between projects

## Learn More

- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [Codefactory Documentation](https://github.com/atzufuki/codefactory)
- [MCP Server Source Code](https://jsr.io/@codefactory/mcp-server)

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review MCP server logs
3. Open an issue on GitHub with error details
