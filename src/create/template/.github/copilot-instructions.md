# CodeFactory Project - GitHub Copilot Instructions

This project uses **CodeFactory** for deterministic AI code generation with a two-phase workflow.

## Project Overview

- **Language**: TypeScript (Deno 2)
- **Purpose**: Define reusable code generation templates (factories) and use a manifest system for reproducible builds
- **Key Concept**: AI creates "recipes" (manifest), then the system executes them deterministically

## Available Factories

All factories are defined in the `factories/` directory. Use the `/codefactory.inspect` command to see the manifest and available factories.

## Directory Structure

```
codefactory.manifest.json  # Build manifest (like package.json)
factories/                 # Code generation template definitions
  ├── index.ts            # Main registry - all factories exported here
  └── examples.ts         # Example factory definitions
examples/
  └── example-workflow.ts # Manifest system demonstration
src/                      # Generated and custom application code
```

## Two-Phase Workflow

### Phase 1: Planning (with AI)
AI parses user intent and adds factory calls to `codefactory.manifest.json`:
- Use natural language to describe what you want
- AI determines the right factory and parameters
- Factory call is saved to manifest (not executed yet)

### Phase 2: Building (deterministic)
Execute the manifest to generate code:
- Read manifest file
- Execute all factory calls in dependency order
- Generate code with markers for safe regeneration
- Same manifest → Always same output

## Working with Factories

### Slash Commands

- **`/codefactory.add <description>`** - Add factory call to manifest (planning phase)
- **`/codefactory.produce`** - Build from manifest (execution phase, deterministic)
- **`/codefactory.update <id> <params>`** - Update factory call in manifest
- **`/codefactory.remove <id>`** - Remove factory call from manifest
- **`/codefactory.inspect`** - Show manifest contents and dependency graph

### Natural Language (Alternative Syntax)

- **"Add X to manifest"** → Uses `/codefactory.add` internally
- **"Build from manifest"** → Uses `/codefactory.produce`
- **"Update X in manifest"** → Uses `/codefactory.update`
- **"Remove X from manifest"** → Uses `/codefactory.remove`
- **"Show manifest"** → Uses `/codefactory.inspect`

## Development Guidelines

### When User Requests Code Generation

**Always use the two-phase manifest approach:**

**Phase 1 - Planning:**
```
User: "Add button component to manifest"
You: /codefactory.add "Create a button component"
→ Adds factory call to codefactory.manifest.json
→ Does NOT generate code yet
```

**Phase 2 - Building:**
```
User: "Build from manifest"
You: /codefactory.produce
→ Reads manifest
→ Executes all factory calls deterministically
→ Generates code to files
```

### Factory Best Practices

- **Names**: Use snake_case (e.g., `api_endpoint`, `react_component`)
- **Parameters**: Define clear, required parameters with descriptions
- **Templates**: Use `{{variable}}` syntax for substitutions
- **Output Paths**: Can include `{{variables}}` for dynamic naming
- **Markers**: All generated code wrapped in `// @codefactory:start` ... `// @codefactory:end`

### Example Workflows

**Adding multiple components:**
```
User: "Add validateEmail function to manifest"
You: /codefactory.add "Create TypeScript function validateEmail with email: string parameter"

User: "Add sanitizeInput function to manifest"
You: /codefactory.add "Create TypeScript function sanitizeInput with input: string parameter"

User: "Build everything"
You: /codefactory.produce
```

**Updating and rebuilding:**
```
User: "Update validateEmail to return ValidationResult instead of boolean"
You: /codefactory.update validate-email-id returnType=ValidationResult

User: "Rebuild"
You: /codefactory.produce
```

## Code Generation Philosophy

> **"Same manifest, same code. Always."**

Two-phase approach separates concerns:
- **Planning** (AI): Creative, flexible, understanding user intent
- **Building** (deterministic): Fast, consistent, zero randomness

Benefits:
- ✅ Same manifest → Always same output
- ✅ Factory updates benefit all projects
- ✅ Version control the "recipe" not the output
- ✅ Fast rebuilding without AI inference
- ✅ Team collaboration through shared manifest

## Commands Reference

### Slash Commands

- `/codefactory.add <description>` - Add factory call to manifest (AI parses intent)
- `/codefactory.produce` - Build from manifest (deterministic, no AI)
- `/codefactory.update <id> <params>` - Update factory call parameters
- `/codefactory.remove <id>` - Remove factory call from manifest
- `/codefactory.inspect` - Show manifest contents and dependency graph

### Natural Language Patterns

- "Add [X] to manifest" → Uses `/codefactory.add`
- "Build from manifest" → Uses `/codefactory.produce`
- "Update [X] in manifest" → Uses `/codefactory.update`
- "Remove [X] from manifest" → Uses `/codefactory.remove`
- "Show manifest" → Uses `/codefactory.inspect`

### Marker-Based File Management

**CRITICAL**: All generated code is wrapped in markers:
```typescript
// @codefactory:start id="factory-call-id"
// Generated code here
// @codefactory:end
```

**Rules:**
1. First generation: Create file with markers
2. Regeneration: Replace only content between markers
3. Error if file exists without markers (tell user to delete file or add markers)

See `examples/MANIFEST_EXAMPLES.md` for complete usage guide.

## Technical Notes

- **Factories**: Defined as `.hbs` template files with frontmatter metadata
- **Templates**: Use Mustache-style `{{variable}}` placeholders
- **Registry**: All factories exported from `factories/index.ts` for auto-discovery
- **Manifest**: `ManifestManager` handles factory call tracking and dependency resolution
- **Producer**: Executes manifest deterministically with marker-based generation
- **Markers**: `// @codefactory:start id="..."` ensures safe regeneration

## API Quick Reference

```typescript
import { ManifestManager, Producer, FactoryRegistry } from "@codefactory/core";

// Load/create manifest
const manager = await ManifestManager.load("./codefactory.manifest.json");

// Add factory call
manager.addFactoryCall({
  id: "my-component",
  factory: "component_factory",
  params: { name: "MyComponent" },
  outputPath: "src/MyComponent.ts",
});
await manager.save();

// Build from manifest
const registry = new FactoryRegistry();
await registry.autoRegister("./factories");
const producer = new Producer(manager.getManifest(), registry);
await producer.buildAll();
```

---

**Remember**: Prefer manifest-based workflow for projects. Use direct generation for quick prototyping.
