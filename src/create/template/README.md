# My CodeFactory Project

A project using [CodeFactory](https://github.com/atzufuki/codefactory) for deterministic code generation.

## Quick Start

### 1. Install VSCode Extension (Recommended)

For the best experience with `.hbs` template files:

**Option A: Install from Extensions Folder** (Development)
```bash
# Copy the extension to your VSCode extensions folder
cp -r /path/to/codefactory/src/vscode-hbs-extension ~/.vscode/extensions/multi-language-templates-0.1.0/

# Reload VSCode
# Ctrl+Shift+P → "Developer: Reload Window"
```

**Option B: VSCode Marketplace** (Coming Soon)
```
Search for "Multi-Language Templates" in VSCode Extensions
```

This enables:
- ✅ YAML frontmatter syntax highlighting
- ✅ TypeScript/Python code highlighting in templates
- ✅ Handlebars tags (`{{variable}}`) recognition
- ✅ Comment syntax (`{{!-- comment --}}`)

### 2. Setup MCP (One-Time)

This project uses Model Context Protocol (MCP) to enable Copilot commands.

**Configure once:**
1. VS Code will detect `.vscode/settings.json` automatically
2. Verify MCP is working: Try `/codefactory.create` in Copilot Chat

If you get "MCP tools not available", see [MCP Setup Guide](https://github.com/atzufuki/codefactory/blob/main/docs/mcp-setup.md)

### 3. Create Your First Component

Use the extraction-based workflow - code is the source of truth!

```bash
# In GitHub Copilot Chat:
/codefactory.create "Button component with label and onClick props"

# This creates: src/components/Button.ts (with @codefactory markers)
```

### 4. Edit Code Directly

The generated file is now your source of truth. Edit it freely:

```typescript
// src/components/Button.ts
// @codefactory:start factory="web_component"
class Button extends HTMLProps(HTMLElement)<ButtonProps>() {
  label: string;
  onClick?: () => void;
  
  // Add signals directly in code
  count = signal<number>(0);  // ← You added this
  isDisabled = signal<boolean>(false);  // ← And this
  
  render() {
    return new html.Button({ content: this.label });
  }
}
// @codefactory:end

// Add custom code below markers (preserved on sync)
export const PrimaryButton = styled(Button);
```

### 5. Sync to Regenerate

When you edit code or factory templates change:

```bash
/codefactory.sync

# System:
# - Extracts parameters from your edited code
# - Regenerates factory section
# - Preserves all custom code
```

### 6. Learn More

- [MCP Setup Guide](https://github.com/atzufuki/codefactory/blob/main/docs/mcp-setup.md) - Configure Copilot integration
- [User Guide](https://github.com/atzufuki/codefactory/blob/main/docs/for-users.md) - Complete command reference
- [Creating Factories](https://github.com/atzufuki/codefactory/blob/main/docs/creating-factories.md) - Build your own templates

## What is CodeFactory?

**Extraction-based code generation** where source code is the single source of truth:

1. **Create** (with AI): Generate file with factory markers
2. **Edit** (directly): Modify generated code as needed
3. **Sync** (deterministic): Re-extract parameters → Regenerate factory sections

**Benefits:**
- ✅ Code contains all parameters (no separate manifest)
- ✅ Edit generated files freely
- ✅ Bidirectional sync (code changes → automatic regeneration)
- ✅ Custom code preserved (outside markers)
- ✅ Template updates benefit all files

## Available Commands

All commands work through MCP:

```bash
/codefactory.create <description>    # Create new file with factory
/codefactory.sync [path]             # Sync files (extract + regenerate)
```

## Manual Tasks (Optional)

```bash
deno task dev          # Run main.ts with watch mode
deno task mcp:dev      # Start MCP server (usually auto-started by Copilot)
```

---

**Built with Deno ���, CodeFactory ���, and Model Context Protocol ���**
