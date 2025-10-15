---
description: Remove a factory call from the manifest
---

# Remove Factory Call

You are helping the user remove a factory call from their manifest.

## Your Task

Call the MCP tool `codefactory_remove` to delete a factory call.

## Process

```typescript
// Remove factory call
await mcp.callTool("codefactory_remove", {
  id: "button-component",
  deleteFile: false,  // Set to true to also delete generated file
  force: false        // Set to true to remove even if other factories depend on it
});
```

## Options

- `deleteFile: true` - Also delete the generated code file
- `force: true` - Remove even if other factories have dependencies on this one

## Response Format

Display the MCP tool's response:

```
‚úÖ Removed factory call: button-component

‚ö†Ô∏è  2 factory calls depended on this:
  - user-card
  - dashboard

Ì≥ù Removed from manifest
```

## Important Notes

- If other factories depend on this one, use `force: true` to proceed
- Use `deleteFile: true` carefully - it will permanently delete generated code
- Generated files with user customizations will be lost if deleted

## MCP Server Setup

The MCP server must be running. If you get errors:
1. Check MCP configuration in IDE
2. Start server: `deno task mcp:dev`
3. See https://github.com/atzufuki/codefactory/blob/main/docs/mcp-setup.md
