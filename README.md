# AI Code Factory 🏭

> Deterministic code generation with two-phase AI workflow

[![Test Status](https://img.shields.io/badge/tests-49%20passing-brightgreen)](./src/codefactory/tests/)
[![Deno 2](https://img.shields.io/badge/deno-2.0-blue)](https://deno.com)

## The Problem

When AI assistants write code directly, they're *probabilistic* - the same request produces different results each time. Projects become inconsistent, hard to maintain, and impossible to regenerate.

## The Solution

**AI Code Factory** uses a **two-phase approach**:

1. **Planning** (with AI): Parse intent → Add to manifest
2. **Building** (deterministic): Execute manifest → Generate code

Think of it as: AI creates the "recipe" (manifest), then the factory executes it deterministically.

### Traditional AI
```
You: "Create a Button component"
AI: *writes code directly, slightly different each time*
You: "Create another Button component"
AI: *writes different code, inconsistent structure*
```

### AI Code Factory
```
You: "Add Button component to manifest"
AI: Adds factory call to codefactory.manifest.json
You: "Build the project"
System: Executes manifest → Generates identical code every time
```

Same manifest = Same code. Always.

## Quick Start

### With GitHub Copilot (VS Code)

```typescript
// In VS Code with GitHub Copilot enabled:

// 1. Add components to manifest
"Add Button component to manifest"
// → AI calls ManifestManager.addFactoryCall()

"Add Card component to manifest"
// → Another factory call added

// 2. Build from manifest
"Build all from manifest"
// → Producer executes all factory calls
// → Files generated with markers for safe regeneration
```

### From Terminal

```bash
# Create a new project
deno run --allow-read --allow-write jsr:@codefactory/create my-project
cd my-project

# Run the example workflow
deno run --allow-read --allow-write examples/example-workflow.ts

# Or use the API directly
deno run --allow-read --allow-write your-script.ts
```

## Key Features

### 🎯 Deterministic
Same manifest → Always same output. Zero AI randomness during build.

### ⚡ Fast
Build phase has no AI inference. Pure factory execution in milliseconds.

### 📝 Marker-Based
Generated code wrapped in markers. User code preserved outside markers.

### 🔄 Rebuildable
Update factory definition → Rebuild → All code uses new version.

### 🔗 Dependencies
Automatic execution order based on `dependsOn` relationships.

## Complete Example

```typescript
import { 
  ManifestManager, 
  Producer, 
  FactoryRegistry 
} from "@codefactory/codefactory";

// 1. Load or create manifest
const manager = await ManifestManager.load("./codefactory.manifest.json");

// 2. Add factory calls (planning phase)
manager.addFactoryCall({
  id: "button-component",
  factory: "design_system_component",
  params: {
    componentName: "Button",
    props: ["label: string", "onClick: () => void"],
  },
  outputPath: "src/components/Button.ts",
});

manager.addFactoryCall({
  id: "card-component",
  factory: "design_system_component",
  params: {
    componentName: "Card",
    props: ["title: string", "content: string"],
  },
  outputPath: "src/components/Card.ts",
  dependsOn: ["button-component"], // Execution order
});

await manager.save();

// 3. Build from manifest (execution phase)
const registry = new FactoryRegistry();
await registry.autoRegister("./factories"); // Auto-discover factories

const producer = new Producer(manager.getManifest(), registry);
const result = await producer.buildAll();

if (result.success) {
  console.log(`✅ Generated ${result.generated.length} files`);
  // Button.ts and Card.ts created with markers
} else {
  console.error("Build failed:", result.errors);
}
```

### Generated Code with Markers

```typescript
// src/components/Button.ts

// @codefactory:start id="button-component"
export class Button extends LitElement {
  @property() label: string = "";
  @property() onClick: () => void = () => {};
  
  render() {
    return html`<button @click=${this.onClick}>${this.label}</button>`;
  }
}
// @codefactory:end

// Your custom code here - safe from regeneration
export const PrimaryButton = styled(Button, { variant: 'primary' });
```

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│ Phase 1: Planning (with AI)                            │
├─────────────────────────────────────────────────────────┤
│ User: "Add Button component"                           │
│   ↓                                                     │
│ AI: Parse intent → Determine factory & params          │
│   ↓                                                     │
│ ManifestManager: Add to codefactory.manifest.json      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 2: Building (deterministic, no AI)               │
├─────────────────────────────────────────────────────────┤
│ Producer: Read manifest                                │
│   ↓                                                     │
│ Resolve dependency order (topological sort)            │
│   ↓                                                     │
│ Execute each factory with saved parameters             │
│   ↓                                                     │
│ Write code with markers for safe regeneration          │
└─────────────────────────────────────────────────────────┘
```

### With GitHub Copilot

The system integrates seamlessly with GitHub Copilot through natural language:

- **"Add X to manifest"** → AI adds factory call
- **"Build from manifest"** → Deterministic code generation
- **"Update X in manifest"** → Modify parameters
- **"Remove X from manifest"** → Clean up
- **"Show manifest"** → Inspect current state

## Use Cases

### Component Libraries
Define once, generate consistently across entire project.

### API Endpoints
Standardize REST/GraphQL endpoint creation with uniform patterns.

### Database Models
Ensure consistent schema patterns and relationships.

### Test Suites
Generate tests following team conventions automatically.

### Project Scaffolding
Bootstrap entire project structures deterministically.

## Benefits

### 🎯 For Developers
- **Control**: Define patterns, AI follows them
- **Speed**: Instant generation without AI latency
- **Consistency**: Same structure everywhere
- **Regeneration**: Update factory → rebuild all

### 👥 For Teams
- **Standards**: Enforce conventions automatically
- **Version Control**: Manifest in Git, not generated code
- **Onboarding**: New members inherit patterns
- **Evolution**: Improve factories, all code benefits

### 🤖 For AI
- **Clarity**: Clear contracts vs ambiguous instructions
- **Reliability**: No hallucinations or errors
- **Efficiency**: Function call vs token generation
- **Context**: Understand project structure from manifest

## Project Structure

This is a Deno workspace with multiple packages:

- **`src/codefactory/`** - Core library for defining and managing factories
- **`src/demo/`** - Example project demonstrating factory usage  
- **`src/create/`** - Project scaffolding CLI (like create-react-app)

```bash
# Run the demo
deno task demo

# Run in watch mode
deno task dev

# Type check all packages
deno task check

# Run tests
deno task test

# Format code
deno task fmt

# Create a new project
deno run --allow-read --allow-write src/create/mod.ts my-project
```

## Project Status

✨ **Feature Complete** - Core system ready with 49 tests passing:

- ✅ Factory system with auto-registration
- ✅ Build manifest system (ManifestManager + Producer)
- ✅ Marker-based safe regeneration
- ✅ Dependency resolution with topological sort
- ✅ GitHub Copilot integration
- ✅ Template system with frontmatter
- 📦 **Next**: JSR publication

## Documentation

- [Build Manifest System](./docs/manifest-system.md) - Two-phase code generation
- [Auto-Registration](./docs/auto-registration.md) - Factory discovery
- [Template System](./docs/template-frontmatter.md) - Frontmatter support
- [Examples](./src/create/template/examples/) - Complete workflows
- [Roadmap](./ROADMAP.md) - Project status and future plans

## Philosophy

> "Same manifest, same code. Always."

Deterministic code generation through:
- **Separation of concerns**: Planning (AI) vs Building (deterministic)
- **Version control**: Track intent (manifest), not output (code)
- **Factory evolution**: Update blueprints, regenerate everything
- **Best of both**: AI intelligence + programming precision

## Contributing

Ideas, feedback, and contributions welcome! See [ROADMAP.md](./ROADMAP.md) for current focus areas.

## License

MIT

---

**Built with Deno 2 🦕 and TypeScript**
