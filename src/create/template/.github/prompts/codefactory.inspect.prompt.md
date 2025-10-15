---
description: View manifest contents and dependency graph
---

# Inspect Manifest

You are helping the user view their manifest contents and project structure.

## Your Task

Call the MCP tool `codefactory_inspect` to display manifest information.

## Process

```typescript
// Show full manifest overview
await mcp.callTool("codefactory_inspect", {
  showGraph: true,   // Include dependency graph
  showStats: true    // Include build statistics
});

// Show details of specific factory call
await mcp.callTool("codefactory_inspect", {
  id: "button-component"
});
```

## Options

- `id: string` - Show detailed view of specific factory call
- `showGraph: boolean` - Include dependency graph visualization (default: true)
- `showStats: boolean` - Include project statistics (default: true)

## Response Format

The MCP tool returns structured manifest information:

**Overview mode:**
```
í³‹ Manifest Overview

Version: 1.0.0
Last generated: 2025-10-15T14:30:00Z
Total factory calls: 5

Factory Calls:
  â€¢ button-component: react_component
  â€¢ user-card: react_component (depends on: icon-component)
  â€¢ user-list: react_component (depends on: user-card)

Dependency Graph:
  icon-component
    â†³ user-card
      â†³ user-list
  button-component

Build Order:
  1. icon-component
  2. button-component
  3. user-card
  4. user-list
```

**Detailed mode (with id):**
```
í³‹ Factory Call: button-component

Factory: react_component
Output: src/components/Button.tsx
Created: 2025-10-15T10:00:00Z

Parameters:
  componentName: "Button"
  props: ["label: string", "onClick: () => void"]

âœ… File exists
```

## Use Cases

- View project structure before building
- Check dependencies before removing a factory call
- Debug build order issues
- Verify manifest contents

## MCP Server Setup

The MCP server must be running. If you get errors:
1. Check MCP configuration in IDE
2. Start server: `deno task mcp:dev`
3. See https://github.com/atzufuki/codefactory/blob/main/docs/mcp-setup.md
