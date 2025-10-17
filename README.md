# AI Code Factory 🏭

> A meta-factory for deterministic AI code generation

[![Test Status](https://img.shields.io/badge/tests-113%20passing-brightgreen)](./src/codefactory/tests/)
[![Deno 2](https://img.shields.io/badge/deno-2.0-blue)](https://deno.com)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-purple)](./docs/mcp-setup.md)

## The Problem

When AI assistants write code directly, they're *probabilistic* - the same request produces different results each time. Projects become inconsistent, hard to maintain, and impossible to regenerate.

## The Solution

**AI Code Factory** uses an **extraction-based approach** where **your code is the source of truth**:

1. **Create** (with AI): Generate file from factory template
2. **Edit** (manual): Modify generated code as needed
3. **Sync** (automatic): Extract changes and regenerate from template

Think of it as: Factories generate consistent code structures, you edit them freely, and the system keeps everything in sync.

### Traditional AI
```
You: "Create a Button component"
AI: *writes code directly, slightly different each time*
You: "Create another Button component"
AI: *writes different code, inconsistent structure*
```

### AI Code Factory
```
You: "Create a Button component"
System: Generates from factory template with markers
You: *Edit the code directly - change names, add features*
System: Extracts your changes, regenerates maintaining structure
```

Your code = Your truth. Always in sync with factory templates.

## Quick Start

### 1. Bootstrap Project

```bash
deno run --allow-read --allow-write jsr:@codefactory/create my-project
cd my-project
```

### 2. Use with GitHub Copilot

**Create files from factories:**
```
You: "Create a Button component"
Copilot: /codefactory.create → Generates Button.tsx with markers
```

**Edit code freely:**
- Rename functions, add features, change logic
- Add custom code outside markers
- Your edits = your truth

**Sync changes:**
```
You: "Sync my changes"
Copilot: /codefactory.sync → Extracts edits, regenerates from template
```

Done! The system keeps your edits while maintaining factory structure.

## Usage Modes

### With GitHub Copilot (Recommended)

**Natural Language:**
```
"Create a Button component"           → Generates from factory
"I edited Button, sync the changes"   → Extracts and regenerates
"Sync all components"                 → Syncs entire directory
```

**Slash Commands:**
```
/codefactory.create factory="component" name="Button"
/codefactory.sync "src/components"
```

### Direct API (Advanced)

For build scripts or custom tooling, see [API documentation](./docs/extraction-system.md).

## Key Features

### 🎯 Deterministic
Factory templates ensure consistent structure. Same factory + same parameters = same code structure, always.

### ⚡ Fast
No AI inference during sync. Pure template execution and parameter extraction in milliseconds.

### 📝 Marker-Based
Generated code wrapped in markers. Custom code outside markers is always preserved during sync.

### 🔄 Bidirectional Sync
Template → Code → Template. Edit code freely, system extracts changes and maintains factory structure.

### 🏗️ Code as Source of Truth
Your edits are automatically extracted and preserved.

## How It Works

### The Workflow

```
1. CREATE                    2. EDIT                     3. SYNC
   ↓                            ↓                           ↓
Factory template          You edit freely          System extracts changes
generates structure       - Rename functions       - Reads your code
with markers              - Add features           - Extracts parameters
                          - Modify logic           - Regenerates structure
                          - Add custom code        - Preserves customizations
```

### Example

**Generated file:**
```typescript
// @codefactory:start factory="react_component"
export function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
// @codefactory:end
```

**You edit it:**
```typescript
// @codefactory:start factory="react_component"
export function PrimaryButton(props: ButtonProps) {
  console.log('Clicked!');  // Your addition
  return <button disabled={props.disabled}>{props.label}</button>;
}
// @codefactory:end

// Your custom code - always preserved
export const SecondaryButton = styled(PrimaryButton);
```

**After sync:**
- Function name "PrimaryButton" extracted ✓
- Your console.log preserved ✓
- disabled prop extracted ✓
- Custom code outside markers untouched ✓
- Factory structure maintained ✓

## Use Cases

- **Component Libraries** - Consistent patterns across components
- **API Endpoints** - Standardize REST/GraphQL patterns  
- **Database Models** - Uniform schema patterns
- **Test Suites** - Tests following team conventions
- **Project Scaffolding** - Bootstrap entire structures

## Benefits

### 🎯 Deterministic
Factory templates ensure consistent structure. Same factory = same code structure, always.

### ⚡ Fast
No AI inference during sync. Pure template execution in milliseconds.

### 🔄 Bidirectional
Template → Code → Template. Edit freely, system extracts and maintains structure.

### 🏗️ Code as Truth
Your edits are the source of truth. No config files to maintain.

## Project Status

✨ **Production Ready** - Extraction-based system with 99 tests passing:

- ✅ Factory system with auto-registration
- ✅ Extraction-based workflow (code as source of truth)
- ✅ Automatic parameter extraction from code
- ✅ Bidirectional sync (Template ↔ Code)
- ✅ Marker-based safe regeneration
- ✅ MCP Server for AI assistant integration
- ✅ GitHub Copilot integration (slash commands + natural language)
- ✅ Template system with Handlebars + frontmatter
- 📦 **Next**: JSR publication

## Documentation

- [Extraction System](./docs/extraction-system.md) - How the system works
- [Creating Factories](./docs/creating-factories.md) - Define your own templates
- [MCP Setup](./docs/mcp-setup.md) - Configure GitHub Copilot
- [Roadmap](./ROADMAP.md) - Project status and plans

## Contributing

Ideas, feedback, and contributions welcome! See [ROADMAP.md](./ROADMAP.md).

## License

MIT

---

**Built with Deno 2 🦕 and TypeScript**
