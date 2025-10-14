# MCP Server for Manifest Operations

## Overview

Create a Model Context Protocol (MCP) server that provides tools for AI assistants to interact with the codefactory manifest system. This would allow AI assistants like Claude Desktop, VS Code with Copilot, and other MCP-compatible clients to add, update, and manage factory calls without writing and executing TypeScript code.

## Motivation

Currently, the `/codefactory.add` prompt instructs AI to:
1. Write TypeScript code using ManifestManager
2. Execute that code in a terminal
3. Parse output and respond

**Problem:** This is indirect, error-prone, and requires the AI to generate correct code every time.

**Solution:** Provide native MCP tools that AI can call directly with structured parameters.

## Proposed MCP Tools

These tools map directly to the 5 Copilot commands (`/codefactory.add`, `/codefactory.produce`, `/codefactory.update`, `/codefactory.remove`, `/codefactory.inspect`).

### 1. `codefactory_add`

Add a factory call to the manifest (planning phase). Maps to `/codefactory.add`.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "description": {
      "type": "string",
      "description": "Natural language description of what to create (e.g., 'a Button component with label and onClick props')"
    },
    "id": {
      "type": "string",
      "description": "Optional: Unique identifier (kebab-case). If omitted, AI generates one from description"
    },
    "factory": {
      "type": "string",
      "description": "Optional: Factory name. If omitted, AI infers from description and available factories"
    },
    "params": {
      "type": "object",
      "description": "Optional: Parameters to pass to the factory. If omitted, AI extracts from description"
    },
    "outputPath": {
      "type": "string",
      "description": "Optional: Path where code will be generated. If omitted, AI infers from factory defaults"
    },
    "dependsOn": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Optional: IDs of factory calls this depends on"
    }
  },
  "required": ["description"]
}
```

**Returns:**
```json
{
  "success": true,
  "id": "button-component",
  "factory": "react_component",
  "outputPath": "src/components/Button.tsx",
  "message": "Factory call added to manifest. Run codefactory_produce to generate code."
}
```

**Example:**
```json
{
  "description": "a Button component with label and onClick props"
}
```

AI infers: `id="button-component"`, `factory="react_component"`, `params={componentName:"Button",props:["label","onClick"]}`, `outputPath="src/components/Button.tsx"`

### 2. `codefactory_produce`

Build code from manifest (deterministic execution phase). Maps to `/codefactory.produce`.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "ids": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Optional: specific factory call IDs to build. If omitted, builds all."
    },
    "dryRun": {
      "type": "boolean",
      "description": "Preview what would be generated without writing files",
      "default": false
    }
  }
}
```

**Returns:**
```json
{
  "success": true,
  "generated": [
    {
      "path": "src/components/Button.tsx",
      "factoryCallId": "button-component",
      "status": "created"
    }
  ],
  "errors": [],
  "duration": 234
}
```

### 3. `codefactory_update`

Update an existing factory call in the manifest. Maps to `/codefactory.update`.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID of the factory call to update"
    },
    "updates": {
      "type": "object",
      "properties": {
        "params": {
          "type": "object",
          "description": "Updated parameters"
        },
        "outputPath": {
          "type": "string",
          "description": "Updated output path"
        },
        "dependsOn": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Updated dependencies"
        }
      },
      "description": "Fields to update (can update params, outputPath, or dependsOn)"
    }
  },
  "required": ["id", "updates"]
}
```

**Returns:**
```json
{
  "success": true,
  "id": "button-component",
  "changes": {
    "params.props": {
      "old": ["label: string"],
      "new": ["label: string", "onClick: () => void"]
    }
  },
  "message": "Updated in manifest. Run codefactory_produce to regenerate with new parameters."
}
```

### 4. `codefactory_remove`

Remove a factory call from the manifest. Maps to `/codefactory.remove`.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "ID of the factory call to remove"
    },
    "deleteFile": {
      "type": "boolean",
      "description": "Whether to also delete the generated file",
      "default": false
    },
    "force": {
      "type": "boolean",
      "description": "Force removal even if other factory calls depend on this one",
      "default": false
    }
  },
  "required": ["id"]
}
```

**Returns:**
```json
{
  "success": true,
  "id": "button-component",
  "outputPath": "src/components/Button.tsx",
  "fileDeleted": false,
  "warnings": [
    "card-component depends on button-component",
    "header-component depends on button-component"
  ],
  "message": "Removed from manifest. 2 factory calls still depend on this."
}
```

### 5. `codefactory_inspect`

Show manifest contents, dependency graph, and build status. Maps to `/codefactory.inspect`.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Optional: Show detailed view of specific factory call. If omitted, shows overview."
    },
    "showGraph": {
      "type": "boolean",
      "description": "Include dependency graph visualization",
      "default": true
    },
    "showStats": {
      "type": "boolean",
      "description": "Include project statistics",
      "default": true
    }
  }
}
```

**Returns:**
```json
{
  "version": "1.0.0",
  "lastGenerated": "2025-10-14T10:30:00Z",
  "factoryCalls": [
    {
      "id": "button-component",
      "factory": "react_component",
      "outputPath": "src/components/Button.tsx",
      "createdAt": "2025-10-14T09:15:00Z",
      "dependsOn": [],
      "status": "generated",
      "fileExists": true
    }
  ],
  "executionOrder": ["button-component", "card-component", "header-component"],
  "dependencyGraph": "button-component\n  ↳ card-component\n  ↳ header-component",
  "statistics": {
    "total": 3,
    "generated": 2,
    "pending": 1,
    "totalDependencies": 3
  }
}
```

## Implementation Plan

### Phase 1: Core MCP Server (5 main tools)

- [ ] Create MCP server package using `@modelcontextprotocol/sdk`
- [ ] Implement `codefactory_add` tool (with AI inference for missing params)
- [ ] Implement `codefactory_produce` tool (buildAll + dry run)
- [ ] Implement `codefactory_inspect` tool (overview + detailed view)
- [ ] Add error handling and validation

### Phase 2: Update & Remove Tools

- [ ] Implement `codefactory_update` tool
- [ ] Implement `codefactory_remove` tool (with dependency checking)
- [ ] Add dependency validation (circular dependency detection)
- [ ] Add marker-based file safety checks

### Phase 3: Integration & Documentation

- [ ] Create MCP server configuration for Claude Desktop
- [ ] Create MCP server configuration for VS Code
- [ ] Update Copilot prompt files to mention MCP alternative
- [ ] Add integration tests for all 5 tools
- [ ] Document workflow: MCP vs Copilot prompts

## Technical Architecture

```
src/
├── codefactory-mcp/           # New MCP server package
│   ├── server.ts              # MCP server entry point
│   ├── tools/
│   │   ├── add.ts            # codefactory_add
│   │   ├── produce.ts        # codefactory_produce
│   │   ├── inspect.ts        # codefactory_inspect
│   │   ├── update.ts         # codefactory_update
│   │   └── remove.ts         # codefactory_remove
│   ├── utils/
│   │   ├── manifest-loader.ts # Wrapper around ManifestManager
│   │   ├── factory-registry.ts # Load available factories
│   │   ├── ai-inference.ts    # Infer factory/params from description
│   │   └── validation.ts      # Input validation
│   ├── deno.json              # Package config
│   ├── mod.ts                 # Public exports
│   └── README.md
├── codefactory/               # Existing core package
├── create/                    # Existing create package
└── demo/                      # Existing demo package
```

## Dependencies

- `@modelcontextprotocol/sdk` - MCP SDK for TypeScript
- `@codefactory/core` - Existing ManifestManager and Producer

## Usage Example (AI Assistant)

**User:** "Add a Button component to the manifest"

**AI (using MCP tool):**
```json
codefactory_add({
  "description": "a Button component with label and onClick props"
})
```

**Tool returns:**
```json
{
  "success": true,
  "id": "button-component",
  "factory": "react_component",
  "outputPath": "src/components/Button.tsx",
  "message": "Factory call added to manifest. Run codefactory_produce to generate code."
}
```

**AI Response:** 
```
✅ Added to manifest: button-component

Factory: react_component
Output: src/components/Button.tsx
Parameters:
  - componentName: "Button"
  - props: ["label: string", "onClick: () => void"]

📝 The factory call has been saved to codefactory.manifest.json
🔨 Run /codefactory.produce to generate the code
```

---

**User:** "Build the project"

**AI (using MCP tool):**
```json
codefactory_produce({})
```

**Tool returns:**
```json
{
  "success": true,
  "generated": [
    {
      "path": "src/components/Button.tsx",
      "factoryCallId": "button-component",
      "status": "created"
    }
  ],
  "errors": [],
  "duration": 156
}
```

**AI Response:**
```
✅ Build completed successfully

Generated files:
  ✓ src/components/Button.tsx (button-component) - created

⏱️ Completed in 156ms
```

## Benefits

1. **Simpler AI interaction** - Direct tool calls instead of code generation
2. **Type safety** - Input validation at the protocol level
3. **Standardized** - Works with any MCP-compatible AI client
4. **Error handling** - Consistent error responses
5. **Extensible** - Easy to add new tools as the system grows

## Related

- VS Code Extension (#TBD) - Could use this MCP server internally
- Chat Participant API (#TBD) - Could expose MCP tools via VS Code chat

## Acceptance Criteria

- [ ] MCP server runs as standalone process
- [ ] All 5 core tools implemented and working:
  - [ ] `codefactory_add` with AI inference
  - [ ] `codefactory_produce` with dry-run support
  - [ ] `codefactory_inspect` with graph visualization
  - [ ] `codefactory_update` with validation
  - [ ] `codefactory_remove` with dependency checking
- [ ] Can be configured in Claude Desktop (`claude_desktop_config.json`)
- [ ] Can be configured in VS Code (via MCP extension)
- [ ] Documentation with setup instructions for both environments
- [ ] Integration tests covering all 5 tools
- [ ] Error messages match Copilot prompt format
- [ ] Tool responses formatted for AI-to-user presentation

## Future Enhancements

- Resource support (read manifest as MCP resource)
- Prompts support (expose common workflows as MCP prompts)
- Streaming support for long-running builds
- WebSocket transport for better VS Code integration
