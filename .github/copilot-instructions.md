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

---

## System Architecture Overview

### High-Level Flow

```
User → Copilot Commands → Core System → Code Generation
  │         │                  │              │
  │         │                  ├─ Factory Registry (discovers factories)
  │         │                  ├─ Manifest Manager (stores plans)
  │         │                  ├─ Producer (executes plans)
  │         │                  └─ Template Loader (loads .hbs files)
  │         │
  │         └─ Commands:
  │            - /codefactory.add     (planning)
  │            - /codefactory.produce (building)
  │            - /codefactory.update  (modify)
  │            - /codefactory.remove  (delete)
  │            - /codefactory.inspect (view)
  │
  └─ User intent (natural language)
```

### Core Components

#### 1. **Factory System** - Template-based code generation

**Files:**
- `src/codefactory/factory.ts` - Factory class wrapper
- `src/codefactory/builder.ts` - defineFactory() helper
- `src/codefactory/types.ts` - TypeScript interfaces

**Purpose:** Encapsulate code generation logic as reusable templates

**Factory Definition (`.hbs` files with frontmatter):**
```handlebars
---
name: react_component
description: Creates a React functional component
outputPath: src/components/{{componentName}}.tsx
params:
  componentName:
    type: string
    required: true
---
export function {{componentName}}(props: {{componentName}}Props) {
  return <div>{{content}}</div>;
}
```

**Key Concepts:**
- Factory = Handlebars template + metadata (frontmatter)
- Templates use `{{variable}}` syntax with full Handlebars support (`{{#if}}`, `{{#each}}`)
- Auto-discovered from filesystem (no manual registration needed)
- Frontmatter defines: name, description, params, outputPath, examples

#### 2. **Template Loader** - Loads `.hbs` files as factories

**File:** `src/codefactory/template-loader.ts`

**Purpose:** Parse Handlebars templates with YAML/JSON frontmatter

**Key Methods:**
- `loadTemplate(path)` → `{ frontmatter, template }`
- `toFactoryDefinition(frontmatter, template)` → `FactoryDefinition`
- `loadDirectory(path)` → `FactoryDefinition[]` (bulk load)
- `loadFactory(path)` → `FactoryDefinition` (convenience)

**How it works:**
1. Read `.hbs` or `.template` file
2. Parse frontmatter (YAML or JSON between `---` delimiters)
3. Compile Handlebars template body
4. Return FactoryDefinition with `generate()` function

**Used by:**
- FactoryRegistry (auto-discovery)
- Built-in factories loading (`registerBuiltIns()`)

#### 3. **Factory Registry** - Discovers and manages factories

**File:** `src/codefactory/registry.ts`

**Purpose:** Central registry of all available factories

**Key Methods:**
- `register(factory)` - Manual registration
- `get(name)` → `Factory | undefined` - Retrieve by name
- `list()` → Array of factory metadata
- `getCatalog()` → Full factory metadata for AI
- `autoRegister(baseUrl, options?)` - Auto-discover from directory
- `registerBuiltIns()` - Load built-in factories from `src/codefactory/factories/`

**Auto-Discovery Algorithm:**
1. Scan directory for files matching pattern (default: `*.{ts,hbs,template}`)
2. Exclude files (default: `index.ts`)
3. For `.hbs`/`.template` files → use TemplateLoader
4. For `.ts` files → dynamic import and extract FactoryDefinition exports
5. Register all discovered factories

**Pattern Matching:**
- Supports brace expansion: `*.{ts,hbs}` matches both `.ts` and `.hbs`
- Recursive option for subdirectories
- Exclude patterns to skip test files etc.

**Used by:**
- User projects (`factories/index.ts`)
- Built-in factory system
- Producer (needs registry to execute factories)

#### 4. **Manifest Manager** - Stores factory calls as JSON

**File:** `src/codefactory/manifest.ts`

**Purpose:** Manage the `codefactory.manifest.json` file (the "recipe")

**Manifest Structure:**
```json
{
  "version": "1.0.0",
  "lastGenerated": "2025-10-15T10:30:00Z",
  "factories": [
    {
      "id": "button-component",
      "factory": "react_component",
      "params": { "componentName": "Button" },
      "outputPath": "src/components/Button.tsx",
      "dependsOn": [],
      "createdAt": "2025-10-15T09:00:00Z"
    }
  ]
}
```

**Key Methods:**
- `load(path)` - Load from disk (or create new)
- `save()` - Persist to disk
- `addFactoryCall(call)` - Add new factory call
- `removeFactoryCall(id)` - Remove by ID
- `updateFactoryCall(id, updates)` - Modify existing call
- `getExecutionOrder()` - Topologically sort by dependencies
- `getAllFactoryCalls()` - Get all calls

**Validation:**
- No duplicate IDs
- Dependencies must exist
- Detects circular dependencies (throws error)
- Validates self-dependencies

**Used by:**
- Copilot commands (add/update/remove/inspect)
- Producer (reads manifest to build)

#### 5. **Producer** - Executes manifest to generate code

**File:** `src/codefactory/producer.ts`

**Purpose:** Deterministic code generation from manifest

**Key Methods:**
- `buildAll()` → `BuildResult` - Execute all factory calls
- `build(ids)` → `BuildResult` - Execute specific IDs
- `dryRun()` → `BuildPreview` - Preview without writing files

**Build Algorithm:**
1. Get factory calls from manifest
2. Sort by dependencies (topological order)
3. For each call:
   - Get factory from registry
   - Execute with params
   - Generate code
   - Write to file with markers
4. Return BuildResult (success, errors, generated files, duration)

**Marker-Based File Management:**
```typescript
// @codefactory:start id="button-component"
// Generated code (replaced on rebuild)
export function Button() { ... }
// @codefactory:end

// User code (preserved forever)
export const PrimaryButton = styled(Button);
```

**Rules:**
- First generation: Create file with markers
- Regeneration: Replace only content between markers
- No markers: Error (refuse to overwrite)

**Error Handling:**
- Factory not found in registry
- Invalid parameters
- File write errors
- Dependency resolution failures

**Used by:**
- `/codefactory.produce` command
- Dry-run for previews

#### 6. **Frontmatter Parser** - YAML/JSON metadata parser

**File:** `src/codefactory/frontmatter.ts`

**Purpose:** Parse metadata from template files

**Key Functions:**
- `parseFrontmatter<T>(content)` → `{ frontmatter: T, body: string }`
- `hasFrontmatter(content)` → `boolean`
- `extractFrontmatter(content)` → `string`

**Supported Formats:**
- YAML (between `---` delimiters)
- JSON (between `---json` and `---` delimiters)

**Used by:**
- TemplateLoader (to extract factory metadata)

---

## How Components Link Together

### Flow 1: Creating a New Factory (Meta-Factory)

```
User: "Create a factory for React components"
  ↓
Copilot: /codefactory.add (parses intent)
  ↓
ManifestManager.addFactoryCall({
  id: "react-component-factory",
  factory: "factory",  ← Meta-factory!
  params: { name: "react_component", template: "...", ... }
})
  ↓
ManifestManager.save() → codefactory.manifest.json
  ↓
User: "Build it"
  ↓
Copilot: /codefactory.produce
  ↓
Producer.buildAll()
  ↓
FactoryRegistry.get("factory") ← Built-in meta-factory
  ↓
Factory.execute(params) → Generates .hbs file
  ↓
File written: factories/react_component.hbs
  ↓
FactoryRegistry.autoRegister() ← Discovers new factory
  ↓
New factory available for use!
```

### Flow 2: Using a Factory to Generate Code

```
User: "Create a Button component"
  ↓
Copilot: /codefactory.add (infers: factory="react_component", params={...})
  ↓
ManifestManager.addFactoryCall({
  id: "button-component",
  factory: "react_component",
  params: { componentName: "Button", props: [...] }
})
  ↓
ManifestManager.save()
  ↓
User: "Build"
  ↓
Producer.buildAll()
  ↓
FactoryRegistry.get("react_component")
  ↓
Factory.execute({ componentName: "Button" })
  ↓
Handlebars renders template
  ↓
Producer writes file with markers:
  // @codefactory:start id="button-component"
  export function Button(props) { ... }
  // @codefactory:end
  ↓
src/components/Button.tsx created!
```

### Flow 3: Factory Auto-Discovery (Project Initialization)

```
User runs: deno run jsr:@codefactory/create my-project
  ↓
Template project created with:
  - factories/index.ts
  - codefactory.manifest.json (empty)
  - src/main.ts
  ↓
factories/index.ts runs:
  const registry = new FactoryRegistry();
  await registry.registerBuiltIns(); ← Loads from codefactory lib
  await registry.autoRegister(import.meta.url); ← Loads user factories
  ↓
FactoryRegistry.registerBuiltIns():
  1. Get built-in path: src/codefactory/factories/
  2. TemplateLoader.loadDirectory(path)
  3. For each .hbs file:
     - Parse frontmatter
     - Compile template
     - Create FactoryDefinition
  4. Register all built-ins (including "factory" meta-factory)
  ↓
FactoryRegistry.autoRegister("./factories"):
  1. Scan ./factories for *.{ts,hbs,template}
  2. Exclude index.ts
  3. For .hbs files → TemplateLoader
  4. For .ts files → dynamic import
  5. Register all discovered factories
  ↓
Registry now contains:
  - Built-in factories (factory, etc.)
  - User-defined factories
  ↓
Ready for use in Copilot commands!
```

### Flow 4: Dependency Management

```
Manifest has:
  - user-card (no deps)
  - user-list (depends on user-card)
  - dashboard (depends on user-list)
  ↓
User: /codefactory.produce
  ↓
ManifestManager.getExecutionOrder()
  ↓
Topological sort algorithm:
  1. Build dependency graph
  2. Detect cycles (throw error if found)
  3. Return sorted order: [user-card, user-list, dashboard]
  ↓
Producer.buildAll() executes in order:
  1. Generate user-card
  2. Generate user-list (can import user-card)
  3. Generate dashboard (can import user-list)
  ↓
All files created in correct order!
```

---

## Copilot Commands Implementation

### How Copilot Commands Work

Each command is defined in `.github/copilot-prompts/*.prompt.md` files.

**Command Structure:**
1. User invokes: `/codefactory.add "description"`
2. Copilot reads: `.github/copilot-prompts/codefactory.add.prompt.md`
3. Copilot follows instructions to:
   - Parse user intent
   - Write TypeScript code using ManifestManager
   - Execute code in terminal
   - Report result

### Command → Core System Mapping

| Command | Core APIs Used | Purpose |
|---------|---------------|---------|
| `/codefactory.add` | `ManifestManager.addFactoryCall()` | Add factory call to manifest (planning) |
| `/codefactory.produce` | `Producer.buildAll()` or `Producer.build(ids)` | Execute manifest (building) |
| `/codefactory.update` | `ManifestManager.updateFactoryCall()` | Modify existing factory call |
| `/codefactory.remove` | `ManifestManager.removeFactoryCall()` | Remove factory call from manifest |
| `/codefactory.inspect` | `ManifestManager.getAllFactoryCalls()`, `getExecutionOrder()` | View manifest contents |

### Example: `/codefactory.add` Implementation

**User input:** `/codefactory.add "a Button component with label prop"`

**Copilot does:**
1. Parse intent:
   - Factory name: "react_component" (inferred from description)
   - ID: "button-component" (generated from component name)
   - Params: `{ componentName: "Button", props: ["label: string"] }`
   - Output path: "src/components/Button.tsx" (from factory default)

2. Generate and execute code:
```typescript
import { ManifestManager } from "@codefactory/core";

const manager = await ManifestManager.load("./codefactory.manifest.json");
manager.addFactoryCall({
  id: "button-component",
  factory: "react_component",
  params: { componentName: "Button", props: ["label: string"] },
  outputPath: "src/components/Button.tsx",
});
await manager.save();
console.log("✅ Added button-component to manifest");
```

3. Run in terminal: `deno run --allow-read --allow-write <temp-file>.ts`

4. Report to user:
```
✅ Added to manifest: button-component

Factory: react_component
Output: src/components/Button.tsx
Parameters:
  - componentName: "Button"
  - props: ["label: string"]

📝 Run /codefactory.produce to generate the code
```

---

## Key Design Decisions

### 1. Template-Only Factory Definition

**Decision:** Use ONLY `.hbs` files with frontmatter for factory definitions

**Why:**
- Single source of truth (no dual TypeScript + template approach)
- Easy to create with meta-factory
- Auto-discoverable from filesystem
- Simple for users to understand
- Templates are language-agnostic

**Alternative rejected:** TypeScript `defineFactory()` calls
- Reason: Creates two ways to do the same thing, confusing for users

### 2. Marker-Based Regeneration

**Decision:** Always wrap generated code in `// @codefactory:start/end` markers

**Why:**
- Safe regeneration (only replace marked sections)
- Allows mixing generated + user code
- Clear boundary between factory output and user additions
- Prevents accidental overwrites

**Alternative rejected:** Replace entire file
- Reason: Would destroy user customizations

### 3. Two-Phase Generation (Manifest System)

**Decision:** Separate planning (add to manifest) from building (execute manifest)

**Why:**
- Deterministic builds (same manifest = same code)
- Version control manifest (team shares "recipe")
- Fast rebuilds (no AI inference during build)
- Dependency management (execute in correct order)
- Factory evolution (update factory, rebuild all)

**Alternative rejected:** Direct generation only
- Reason: No rebuild capability, no determinism guarantee

### 4. Auto-Discovery vs Manual Registration

**Decision:** Support both, prefer auto-discovery

**Why:**
- Auto-discovery: Zero boilerplate for users
- Manual: Allows programmatic factory creation
- Built-ins use auto-discovery from `src/codefactory/factories/`
- User projects use auto-discovery from `./factories/`

### 5. Handlebars as Template Engine

**Decision:** Use Handlebars for all template rendering

**Why:**
- Industry standard (widely known)
- Full featured (`{{#if}}`, `{{#each}}`, helpers)
- Works with any output language
- Simple syntax for basic cases
- Powerful for complex cases

**Alternative rejected:** Custom template syntax
- Reason: Reinventing the wheel, smaller ecosystem

---

## Manifest System - Two-Phase Code Generation

### Overview
The manifest system separates code generation into two phases:

1. **Planning Phase** (with AI): Parse user intent → Add to manifest
2. **Build Phase** (deterministic): Read manifest → Execute factories → Generate code

This is the **core workflow** that all Copilot commands follow.

### Workflow for AI Assistants

When user asks to generate code, AI should use **manifest-based workflow** (recommended):

```typescript
// Step 1: Add to manifest (planning) - /codefactory.add
const manager = await ManifestManager.load("./codefactory.manifest.json");
manager.addFactoryCall({
  id: "user-list-component",
  factory: "react_component",
  params: { componentName: "UserList", props: ["users: User[]"] },
  outputPath: "src/components/UserList.tsx",
});
await manager.save();

// Step 2: Build (execution) - /codefactory.produce
const producer = new Producer(manager.getManifest(), registry);
const result = await producer.buildAll();
```

**Alternative: Direct Generation** (for one-off tasks):
```typescript
// Load registry and execute factory immediately
const registry = new FactoryRegistry();
await registry.autoRegister("./factories");
const factory = registry.get("component_factory");
const result = await factory.execute({ name: "Button" });
// Write to file manually
```

### When to Use Each Approach

**Use Manifest System (recommended):**
- User is building a project with multiple components
- User wants to track what was generated
- User wants to regenerate/rebuild later
- User wants deterministic builds
- Project has dependencies between generated files

**Use Direct Generation (rare):**
- User wants immediate code generation
- One-off code generation task
- Quick prototyping or examples
- No need to rebuild later

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

---

## AI Command Patterns for Copilot

These are the patterns AI should follow when user makes requests:

### Pattern 1: "Add [component] to manifest"

**User says:** "Add a Button component to manifest" or "Plan to create a Card component"

**AI does:**
1. Parse user intent:
   - Infer factory name (e.g., "react_component")
   - Extract parameters from description
   - Generate unique ID (e.g., "button-component")
2. Use `/codefactory.add` command or write code:
```typescript
import { ManifestManager } from "@codefactory/core";
const manager = await ManifestManager.load("./codefactory.manifest.json");
manager.addFactoryCall({
  id: "button-component",
  factory: "react_component",
  params: { componentName: "Button", props: ["label: string"] },
  outputPath: "src/components/Button.tsx",
});
await manager.save();
```
3. Respond: "Added to manifest. Run /codefactory.produce to generate."

### Pattern 2: "Build from manifest"

**User says:** "Build the project" or "Generate all code" or "Run the manifest"

**AI does:**
1. Use `/codefactory.produce` command or write code:
```typescript
import { ManifestManager, Producer, FactoryRegistry } from "@codefactory/core";

const manager = await ManifestManager.load("./codefactory.manifest.json");
const registry = new FactoryRegistry();
await registry.autoRegister("./factories");

const producer = new Producer(manager.getManifest(), registry);
const result = await producer.buildAll();

if (result.success) {
  console.log(`✅ Generated ${result.generated.length} files`);
} else {
  console.error(`❌ Build failed with ${result.errors.length} errors`);
}
```
2. Report what was generated

### Pattern 3: "Update [id] in manifest"

**User says:** "Update button-component to add disabled prop"

**AI does:**
1. Use `/codefactory.update` command or write code:
```typescript
const manager = await ManifestManager.load("./codefactory.manifest.json");
manager.updateFactoryCall("button-component", {
  params: {
    componentName: "Button",
    props: ["label: string", "onClick: () => void", "disabled: boolean"]
  }
});
await manager.save();
```
2. Suggest running `/codefactory.produce` to rebuild

### Pattern 4: "Remove [id] from manifest"

**User says:** "Remove button-component from manifest"

**AI does:**
1. Use `/codefactory.remove` command or write code:
```typescript
const manager = await ManifestManager.load("./codefactory.manifest.json");
manager.removeFactoryCall("button-component");
await manager.save();
```
2. Optionally delete generated file

### Pattern 5: "Show manifest" or "Inspect project"

**User says:** "Show me what's in the manifest" or "Inspect the project"

**AI does:**
1. Use `/codefactory.inspect` command or write code:
```typescript
const manager = await ManifestManager.load("./codefactory.manifest.json");
const calls = manager.getAllFactoryCalls();
const order = manager.getExecutionOrder();

console.log(`📋 Manifest contains ${calls.length} factory calls:`);
for (const call of calls) {
  console.log(`\n${call.id}:`);
  console.log(`  Factory: ${call.factory}`);
  console.log(`  Output: ${call.outputPath}`);
  if (call.dependsOn?.length) {
    console.log(`  Depends on: ${call.dependsOn.join(", ")}`);
  }
}
```
2. Display factory calls, dependency graph, build status

---

## Complete Examples

### Example 1: Creating a New Factory

**User:** "Create a factory for React hooks"

**Copilot uses meta-factory:**
```typescript
// Step 1: Add factory creation to manifest
manager.addFactoryCall({
  id: "react-hook-factory",
  factory: "factory", // Meta-factory!
  params: {
    name: "react_hook",
    description: "Creates a custom React hook",
    template: "export function {{hookName}}() {\n  // Hook logic\n}",
    outputPath: "src/hooks/{{hookName}}.ts"
  },
  outputPath: "factories/react_hook.hbs"
});

// Step 2: Build to create the factory
await producer.buildAll();

// Step 3: Auto-discovery picks up new factory
await registry.autoRegister("./factories");

// Now "react_hook" factory is available!
```

### Example 2: Using a Factory with Dependencies

**User:** "Create UserCard and UserList components, where UserList uses UserCard"

**Copilot creates both with dependency:**
```typescript
// Add UserCard (no dependencies)
manager.addFactoryCall({
  id: "user-card",
  factory: "react_component",
  params: { componentName: "UserCard", props: ["user: User"] },
  outputPath: "src/components/UserCard.tsx"
});

// Add UserList (depends on UserCard)
manager.addFactoryCall({
  id: "user-list",
  factory: "react_component",
  params: { componentName: "UserList", props: ["users: User[]"] },
  outputPath: "src/components/UserList.tsx",
  dependsOn: ["user-card"] // Ensures UserCard is generated first
});

await manager.save();

// Build in correct order (UserCard → UserList)
const result = await producer.buildAll();
```

---

## File Structure Reference

```
project/
├── .github/
│   ├── copilot-instructions.md          ← This file (architecture docs)
│   └── copilot-prompts/                 ← Copilot command definitions
│       ├── codefactory.add.prompt.md
│       ├── codefactory.produce.prompt.md
│       ├── codefactory.update.prompt.md
│       ├── codefactory.remove.prompt.md
│       └── codefactory.inspect.prompt.md
├── src/
│   └── codefactory/                     ← Core library
│       ├── factory.ts                   ← Factory class wrapper
│       ├── builder.ts                   ← defineFactory() helper
│       ├── registry.ts                  ← Factory discovery & management
│       ├── template-loader.ts           ← .hbs file loader
│       ├── manifest.ts                  ← Manifest CRUD operations
│       ├── producer.ts                  ← Code generation executor
│       ├── frontmatter.ts               ← YAML/JSON parser
│       ├── types.ts                     ← TypeScript interfaces
│       ├── factories/                   ← Built-in factories
│       │   └── factory.hbs          ← Meta-factory template
│       └── tests/                       ← Test suite (44 tests)
│           ├── registry.test.ts
│           ├── template-loader.test.ts
│           ├── manifest.test.ts
│           ├── producer.test.ts
│           └── frontmatter.test.ts
└── docs/                                ← User documentation
    ├── for-users.md                     ← Copilot commands guide
    ├── for-contributors.md              ← Architecture & API docs
    ├── creating-factories.md            ← Factory creation guide
    └── manifest-system.md               ← Manifest workflow guide
```

---

## Testing & Quality

**Test Coverage:**
- ✅ 44 tests passing (16 frontmatter, 6 manifest, 6 producer, 3 registry, 13 template-loader)
- ✅ Type checking: `deno task check` passes
- ✅ Linting: `deno task lint` passes
- ✅ Formatting: `deno task fmt` passes

**Run tests:**
```bash
deno task test          # All tests
deno task check         # Type checking
deno task lint          # Linting
deno task fmt           # Format code
```

---

## Summary for AI Assistants

**When user wants to generate code:**

1. ✅ **Use manifest system** (recommended)
   - Add factory call to manifest (`/codefactory.add`)
   - Build later (`/codefactory.produce`)
   - Deterministic, rebuildable, version-controlled

2. ❌ **Avoid direct generation** (unless one-off task)
   - No tracking
   - Not rebuildable
   - No dependency management

**Key APIs to remember:**
- `ManifestManager.addFactoryCall()` - Planning phase
- `Producer.buildAll()` - Execution phase
- `FactoryRegistry.autoRegister()` - Factory discovery
- `TemplateLoader.loadFactory()` - Load .hbs files

**Always wrap generated code in markers:**
```typescript
// @codefactory:start id="unique-id"
// Generated code here
// @codefactory:end
```

**Meta-factory (`factory`) creates new factories:**
- Input: name, description, template, outputPath
- Output: .hbs file in factories/ directory
- Auto-discovered on next registry load
