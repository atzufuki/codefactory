# GitHub Copilot Prompts

This directory contains GitHub Copilot slash command definitions for CodeFactory.

## Available Commands

The following slash commands are available for manifest-based workflow:

- `/codefactory.add` - Add factory call to manifest (planning phase)
- `/codefactory.produce` - Build from manifest (execution phase)
- `/codefactory.update` - Update factory call in manifest
- `/codefactory.remove` - Remove factory call from manifest
- `/codefactory.inspect` - Show manifest contents and dependency graph

## Usage

Use these commands in GitHub Copilot chat:

```
/codefactory.add "Create a Button component with label prop"
/codefactory.produce
/codefactory.inspect
```

Or use natural language - Copilot will translate to the appropriate command:

```
"Add Button component to manifest"
"Build from manifest"
"Show me the manifest"
```

See `../.github/copilot-instructions.md` for complete usage guidance.

## Implementation

These slash commands use the [GitHub Copilot Prompt Files](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot) pattern for zero-installation integration.
