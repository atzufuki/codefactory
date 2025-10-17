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
2. Verify MCP is working: `/codefactory.inspect` in Copilot Chat

If you get "MCP tools not available", see [MCP Setup Guide](https://github.com/atzufuki/codefactory/blob/main/docs/mcp-setup.md)

### 3. Create a Factory

Use the built-in `factory` meta-factory to create new code generators:

```bash
# In GitHub Copilot Chat:
/codefactory.add "a 'factory' for TypeScript function with params and return type"
/codefactory.produce

# This creates: factories/typescript_function.hbs
```

### 4. Use Your Factory

```bash
/codefactory.add "a 'typescript_function' for calculateTotal"
/codefactory.produce

# This creates: src/calculateTotal.ts
```

### 5. Learn More

- [MCP Setup Guide](https://github.com/atzufuki/codefactory/blob/main/docs/mcp-setup.md) - Configure Copilot integration
- [User Guide](https://github.com/atzufuki/codefactory/blob/main/docs/for-users.md) - Copilot commands
- [Creating Factories](https://github.com/atzufuki/codefactory/blob/main/docs/creating-factories.md) - Factory guide
- [Manifest System](https://github.com/atzufuki/codefactory/blob/main/docs/manifest-system.md) - How it works

## What is CodeFactory?

Two-phase code generation:
1. **Plan** (with AI): Add factory calls to `codefactory.manifest.json`
2. **Build** (deterministic): Execute manifest → Generate code

**Benefits:**
- Same manifest = Same code, always
- Fast rebuilds without AI
- Version control the "recipe"
- Factory updates benefit all code

## Available Commands

All commands work through MCP (no code generation by Copilot needed):

```bash
/codefactory.add <description>       # Add to manifest (planning)
/codefactory.produce                 # Build from manifest
/codefactory.update <id> <changes>   # Update factory call
/codefactory.remove <id>             # Remove factory call
/codefactory.inspect                 # Show manifest
```

## Manual Tasks (Optional)

```bash
deno task dev          # Run main.ts with watch mode
deno task mcp:dev      # Start MCP server (usually auto-started by Copilot)
deno task example      # Run example workflow
deno task build        # Execute manifest to generate code
```

---

**Built with Deno ���, CodeFactory ���, and Model Context Protocol ���**
