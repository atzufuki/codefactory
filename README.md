# AI Code Factory 🏭

> A meta-factory for deterministic AI code generation

[![Test Status](https://img.shields.io/badge/tests-134%20passing-brightgreen)](./src/codefactory/tests/)
[![Deno 2](https://img.shields.io/badge/deno-2.0-blue)](https://deno.com)
[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-purple)](./docs/mcp-setup.md)

## The Problem

When AI assistants write code directly, they're *probabilistic* - the same request produces different results each time. Projects become inconsistent and hard to maintain.

## The Solution

**AI Code Factory** makes AI code generation *deterministic* through **factory templates**:
1. **Spec** → Define what you need (component, endpoint, model)
2. **Factory** → AI creates a factory template matching the spec
3. **Generate** → AI provides parameters, factory produces consistent code
4. **Sync** → Regenerates files from templates when you edit the template or the params

**Flow:** Spec (what) → Factory (how) → Parameters (details) → Code (result)

### Traditional AI (Probabilistic)

AI writes code **directly** with full language capabilities:
- Has complete control over the generated file
- Can use any language feature or pattern
- Different results every time
- No structural guarantees

### AI Code Factory (Deterministic)

AI modifies **factory templates only**, code generation happens through defined interface:
- AI edits template structure (constrained changes)
- Code generation follows template's defined interface
- No AI coding source files directly
- Narrower error margin through controlled generation

## Quick Start

### 1. Install CLI (Standalone Binary)

Download pre-built binary (not working yet, coming soon):

```bash
curl -fsSL https://codefactory.dev/install.sh | sh
```

Or build and install from source:

```bash
deno task build:all
deno task install:all
```

### 2. Initialize Project

Initialize a new project:

```bash
codefactory init my-project
```

Or inside an existing project:

```bash
codefactory init
```

### 3. Use the CLI

```bash
# List available factories
codefactory list

# Create a file from a factory
codefactory create example_component \
  --params '{"componentName":"Button","hasProps":true}' \
  --output src/Button.ts

# Edit the generated file freely, then sync
codefactory sync src/Button.ts

# Or sync entire directory
codefactory sync src/

# Validate all factories
codefactory validate
```

### 4. OR Use with GitHub Copilot (AI Assistant)

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

### CLI (Standalone Binary)

**Manual Control:**
```bash
# Initialize project
codefactory init

# List factories
codefactory list

# Create from factory
codefactory create <factory-name> \
  --params '{"key":"value"}' \
  --output <path>

# Sync changes
codefactory sync <file-or-directory>

# Validate templates
codefactory validate

# Start MCP server for AI assistants
codefactory mcp
```

### With GitHub Copilot (AI Assistant)

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

### 📝 Metadata-Based
Generated code includes JSDoc metadata header. System uses metadata to track factory and parameters.

### 🔄 Bidirectional Sync
Template → Code → Template. Edit code freely, system extracts changes and regenerates with new params.

### 🏗️ Code as Source of Truth
Your edits are automatically extracted and used to regenerate the file.

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
