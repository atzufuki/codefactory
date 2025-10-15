---
description: Update an existing factory call in the manifest
---

# Update Factory Call

You are helping the user update an existing factory call in their manifest.

## Your Task

Call the MCP tool `codefactory_update` to modify a factory call.

## Process

```typescript
// Update parameters
await mcp.callTool("codefactory_update", {
  id: "button-component",
  params: {
    // New parameters (will merge with existing)
    props: ["label: string", "onClick: () => void", "disabled: boolean"]
  }
});

// Update output path
await mcp.callTool("codefactory_update", {
  id: "button-component",
  outputPath: "src/ui/Button.tsx"
});

// Update dependencies
await mcp.callTool("codefactory_update", {
  id: "user-list",
  dependsOn: ["user-card", "pagination"]
});
```

## Response Format

Display the MCP tool's response:

```
‚úÖ Updated factory call: button-component

Changes:
  ‚Ä¢ params.props: ["label: string"] ‚Üí ["label: string", "onClick: () => void", "disabled: boolean"]

Ì≥ù Changes saved to manifest
Ì¥® Run /codefactory.produce to regenerate the code
```

## Important Notes

- After updating, run `/codefactory.produce` to regenerate code
- Parameters are merged (not replaced) unless you pass the full object
- Cannot change `id` or `createdAt` fields

## MCP Server Setup

The MCP server must be running. If you get errors:
1. Check MCP configuration in IDE
2. Start server: `deno task mcp:dev`
3. See https://github.com/atzufuki/codefactory/blob/main/docs/mcp-setup.md
