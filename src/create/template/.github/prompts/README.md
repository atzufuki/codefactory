# GitHub Copilot Prompts

This directory contains GitHub Copilot slash command definitions for CodeFactory.

## Available Commands

The following slash commands are available for **extraction-based workflow** (recommended):

- `/codefactory.create` - Create a new file using a factory
- `/codefactory.sync` - Sync files by extracting params and regenerating

## New Workflow (Extraction-Based)

### 1. Create File
```
/codefactory.create "Button component with label and onClick props"
```

This generates a file with the new marker format:
```typescript
// @codefactory:start factory="web_component"
// ... generated code ...
// @codefactory:end

// Add custom code below (will be preserved)
```

### 2. Edit Code Directly
Open the file and edit it:
- Add/remove signals
- Change props
- Modify any parameters

### 3. Sync Changes
```
/codefactory.sync
```

This:
- Extracts parameters from your edited code
- Regenerates factory sections
- Preserves all custom code outside markers

## Benefits

✅ **Single Source of Truth** - Code contains all parameters
✅ **Direct Editing** - Edit generated files freely
✅ **Bidirectional Sync** - Changes in code → Regenerated automatically
✅ **Simple Workflow** - Create → Edit → Sync

## Usage

Use these commands in GitHub Copilot chat:

```
/codefactory.create "Counter component with count signal"
/codefactory.sync
```

Or use natural language - Copilot will translate to the appropriate command:

```
"Create a Button component"
"Sync all codefactory files"
```

See `../../copilot-instructions.md` for complete usage guidance.

## Implementation

These slash commands use the [GitHub Copilot Prompt Files](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot) pattern for zero-installation integration.

They call MCP tools under the hood:
- `/codefactory.create` → `codefactory_create` MCP tool
- `/codefactory.sync` → `codefactory_sync` MCP tool
