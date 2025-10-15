---
description: Add a factory call to the manifest (planning phase)
---

# Add Factory Call to Manifest

You are helping the user add a factory call to their `codefactory.manifest.json` file using the MCP server.

## Your Task

1. **Parse the user's intent** from their description
2. **Call the MCP tool** `codefactory_add` with the parsed information

The MCP tool will automatically:
- Determine which factory to use
- Extract parameters from user intent  
- Generate a unique ID
- Add to manifest and save

## Process

Use the Model Context Protocol (MCP) tool:

```typescript
// The MCP server handles all the logic - just call the tool
await mcp.callTool("codefactory_add", {
  userIntent: "Create a Button component with label and onClick props"
  // Optional overrides:
  // id: "custom-id",
  // factory: "specific_factory",
  // params: { ... },
  // outputPath: "custom/path.ts",
  // dependsOn: ["other-id"]
});
```

The tool automatically:
- Discovers available factories
- Matches user intent to best factory using AI
- Generates appropriate parameters
- Creates a unique ID (kebab-case)
- Validates and saves to manifest

## Response Format

Display the MCP tool's response to the user:

```
‚úÖ Added to manifest: [descriptive-id]

Factory: [factory_name]
Output: [outputPath]
Parameters:
  - [param1]: [value1]
  - [param2]: [value2]

Ì≥ù The factory call has been saved to codefactory.manifest.json
Ì¥® Run /codefactory.produce to generate the code
```

## Important Notes

- **Always use the MCP tool** - don't manually manipulate manifest files
- **The tool handles AI inference** - just provide user intent in natural language
- **Do NOT generate code yet** - this is the planning phase only
- You can override tool inference by providing explicit parameters

## Examples

**Example 1: Simple component**
```typescript
User: "Add a Button component"

await mcp.callTool("codefactory_add", {
  userIntent: "Button component with label prop"
});
```

**Example 2: With explicit parameters**
```typescript
User: "Add a UserCard component with name, email, and avatar props"

await mcp.callTool("codefactory_add", {
  userIntent: "UserCard component",
  params: {
    componentName: "UserCard",
    props: ["name: string", "email: string", "avatar: string"]
  }
});
```

**Example 3: With dependencies**
```typescript
User: "Add a UserList that uses UserCard"

await mcp.callTool("codefactory_add", {
  userIntent: "UserList component that renders a list of UserCards",
  dependsOn: ["user-card-component"]
});
```

## Error Handling

The MCP tool will return errors if:
- Factory doesn't exist
- ID conflicts with existing
- Required parameters missing
- Validation fails

Display errors to the user and suggest corrections.

## MCP Server Setup

**CRITICAL**: The MCP server must be running for this command to work.

If you get an error about MCP tools not being available:
1. User needs to configure MCP in their IDE settings
2. Start the server: `deno task mcp:dev`
3. See https://github.com/atzufuki/codefactory/blob/main/docs/mcp-setup.md for setup instructions
