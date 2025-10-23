# MCP Server Setup Guide

Enable AI assistants (GitHub Copilot) to use CodeFactory tools through the Model Context Protocol (MCP).

## Quick Setup

### VS Code with GitHub Copilot (1.99+)

Create `.vscode/mcp.json`:

```json
{
  "servers": {
    "codefactory": {
      "type": "stdio",
      "command": "codefactory",
      "args": ["mcp"]
    }
  }
}
```

**Start the server:**
1. Open `.vscode/mcp.json`
2. Click "Start" button
3. Open Copilot Chat → Tools icon (🔧) to verify

## Available Tools

| Tool | Description | Usage |
|------|-------------|-------|
| `codefactory_create` | Create file from factory | "Create a Button component" |
| `codefactory_sync` | Sync edited files | "Sync my changes in src/" |

## Troubleshooting

### Tools not showing up (VS Code)

1. **Start the server** - Open `.vscode/mcp.json` and click "Start"
2. **Check version** - Run `code --version` (must be 1.99+)
3. **Verify CLI** - Run `codefactory --version`

3. **Verify CLI** - Run `codefactory --version`

### Server crashes

**VS Code:** View → Output → Select "MCP"  

## Advanced Configuration

### Development Setup

Using local development version instead of installed CLI:

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
        "/path/to/codefactory/src/mcp-server/server.ts"
      ],
      "env": {
        "CODEFACTORY_FACTORIES_DIR": "${workspaceFolder}/factories"
      }
    }
  }
}
```

### Custom Factory Directory

```json
{
  "servers": {
    "codefactory": {
      "type": "stdio",
      "command": "codefactory",
      "args": ["mcp"],
      "env": {
        "CODEFACTORY_FACTORIES_DIR": "/custom/path/to/factories"
      }
    }
  }
}
```

## Learn More

- [Model Context Protocol](https://modelcontextprotocol.io)
- [CodeFactory Documentation](https://github.com/atzufuki/codefactory)

