---
description: Build code from manifest (execution phase)
---

# Build Code from Manifest

You are helping the user execute their `codefactory.manifest.json` to generate code.

## Your Task

Call the MCP tool `codefactory_produce` to build the code.

## Process

```typescript
// Build all factory calls in manifest
await mcp.callTool("codefactory_produce", {
  dryRun: false  // Set to true to preview without writing files
});

// Or build specific factory calls only:
await mcp.callTool("codefactory_produce", {
  ids: ["button-component", "user-card"],
  dryRun: false
});
```

## Options

- `dryRun: true` - Preview what would be generated without writing files
- `ids: string[]` - Build only specific factory call IDs

## Response Format

Display the MCP tool's response:

```
✅ Build completed successfully

Generated 3 files:
  ✓ src/components/Button.tsx
  ✓ src/components/UserCard.tsx
  ✓ src/components/UserList.tsx

⏱️  Completed in 45ms
```

## Important Notes

- This executes the manifest deterministically
- Generated code is wrapped in `@codefactory` markers for safe regeneration
- Use `dryRun: true` to preview changes before writing files

## MCP Server Setup

The MCP server must be running. If you get errors:
1. Check MCP configuration in IDE
2. Start server: `deno task mcp:dev`
3. See https://github.com/atzufuki/codefactory/blob/main/docs/mcp-setup.md
