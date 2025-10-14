# AI Code Factory - Copilot Instructions

This project is building a meta-factory system for AI code generation using Deno 2 and TypeScript.

## Project Overview
- **Language**: TypeScript (Deno 2)
- **Purpose**: A library that allows developers to define deterministic code generation templates (factories) that AI assistants can use instead of writing code directly
- **Key Concept**: Reduce AI variability by having AI call predefined factories with parameters, rather than writing code from scratch

## Development Guidelines
- Use Deno 2 APIs and conventions
- Focus on TypeScript type safety
- Keep the API simple and intuitive for developers
- Prioritize deterministic output over flexibility
- Design for composition (factories can call other factories)

## Architecture Principles
1. **Factory Definition**: Simple way for developers to define code generation templates
2. **Parameter Validation**: Strong typing and validation before code generation
3. **Composability**: Factories can reference and use other factories
4. **Language Agnostic Output**: Factories can generate code in any language
5. **AI Integration**: Clear protocol for AI to discover and use factories

## Manifest System - Two-Phase Code Generation

### Overview
The manifest system separates code generation into two phases:

1. **Planning Phase** (with AI): Parse user intent → Add to manifest
2. **Build Phase** (deterministic): Read manifest → Execute factories → Generate code

### Key Components

#### ManifestManager (`src/codefactory/manifest.ts`)
Manages the `codefactory.manifest.json` file that stores factory calls:
- `addFactoryCall(call)` - Add factory call to manifest
- `removeFactoryCall(id)` - Remove factory call by ID
- `updateFactoryCall(id, updates)` - Update existing call
- `getExecutionOrder()` - Get topologically sorted execution order
- `save()` / `load(path)` - Persist to disk

#### Producer (`src/codefactory/producer.ts`)
Executes factory calls from manifest:
- `buildAll()` - Execute all factory calls
- `build(ids)` - Execute specific calls by ID
- `dryRun()` - Preview what would be generated

### Workflow for AI Assistants

When user asks to generate code:

#### Option 1: Direct Generation (immediate)
```typescript
// Load registry and execute factory immediately
const registry = new FactoryRegistry();
await registry.autoRegister("./factories");
const factory = registry.get("component_factory");
const result = await factory.execute({ name: "Button" });
// Write to file
```

#### Option 2: Manifest-Based (recommended for projects)
```typescript
// Step 1: Add to manifest (planning)
const manager = await ManifestManager.load("./codefactory.manifest.json");
manager.addFactoryCall({
  id: "user-list-component",
  factory: "react_component",
  params: { componentName: "UserList", props: ["users: User[]"] },
  outputPath: "src/components/UserList.tsx",
});
await manager.save();

// Step 2: Build (execution) - can be done later
const producer = new Producer(manager.getManifest(), registry);
const result = await producer.buildAll();
```

### When to Use Each Approach

**Use Direct Generation when:**
- User wants immediate code generation
- One-off code generation task
- Quick prototyping or examples
- No need to rebuild later

**Use Manifest System when:**
- User is building a project with multiple components
- User wants to track what was generated
- User wants to regenerate/rebuild later
- User wants deterministic builds
- Project has dependencies between generated files

### Marker-Based File Management

**CRITICAL**: All generated code MUST be wrapped in markers:

```typescript
// @codefactory:start id="factory-call-id"
// Generated code here
export function greet(name: string) {
  return `Hello, ${name}!`;
}
// @codefactory:end
```

**Rules:**
1. **Always use markers** - Never generate code without markers
2. **First generation**: Create file with markers
3. **Regeneration**: Replace only content between markers
4. **Error if no markers**: If file exists without markers, refuse to generate and tell user to:
   - Delete the file, or
   - Add markers manually, or
   - Change outputPath in manifest

### AI Commands (Conceptual)

These are the patterns AI should follow when user requests:

**"Add [component] to manifest"** or **"Plan to create [component]"**:
- Parse user intent
- Determine factory name and parameters
- Use `ManifestManager.addFactoryCall()`
- Respond: "Added to manifest. Run build to generate."

**"Build from manifest"** or **"Generate all code"**:
- Load manifest with `ManifestManager.load()`
- Create `Producer` with manifest and registry
- Call `producer.buildAll()`
- Report what was generated

**"Update [id] in manifest"**:
- Load manifest
- Use `manager.updateFactoryCall(id, updates)`
- Save manifest
- Suggest rebuild

**"Remove [id] from manifest"**:
- Load manifest
- Use `manager.removeFactoryCall(id)`
- Save manifest
- Optionally delete generated file

**"Show manifest"** or **"Inspect project"**:
- Load manifest
- Display factory calls
- Show dependency graph
- Indicate what's been built vs pending
