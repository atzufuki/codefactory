# AI Code Factory 🏭

> A meta-factory for deterministic AI code generation

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

### Step 0: Bootstrap a New Project

Start fresh with a pre-configured project:

```bash
# Create a new project with example factories
deno run --allow-read --allow-write jsr:@codefactory/create my-project
cd my-project

# The project includes:
# - Example factories in factories/
# - Sample manifest in codefactory.manifest.json
# - GitHub Copilot integration ready to use
```

Or add to an existing project - just start using the commands below!

### Step 1: Create Your First Factory

Before generating code, create a factory (code generator) using the built-in 'factory':

```bash
# In VS Code with GitHub Copilot:
/codefactory.add "a 'factory' for functional React component with props interface"

# This adds to manifest:
# - factory: factory
# - params: name="react_component", template="...", outputPath="factories/react_component.ts"

# Build the factory definition file
/codefactory.produce
```

This generates `factories/react_component.ts` - your first factory! Now you can use it to generate components.

💡 **Tip:** See [Creating Factories](./docs/creating-factories.md) for more patterns and examples.

### Step 2: Use Your Factory

Now use your 'react_component' factory to generate code:

```bash
# Add component to manifest using your factory
/codefactory.add "a 'react_component' for Button with label and onClick props"

# This adds to manifest:
# - factory: react_component
# - params: componentName="Button", props=["label: string", "onClick: () => void"]

# Build from manifest (generates the actual component)
/codefactory.produce
```

### Step 3: More Commands

```bash
# Update existing factory call
/codefactory.update button-component props="label: string, onClick: () => void, disabled: boolean"

# Remove factory call from manifest
/codefactory.remove button-component

# Show manifest contents
/codefactory.inspect
```

Or use natural language for manifest-based workflow:

```typescript
// In VS Code with GitHub Copilot chat:

"add Button component to manifest"
// → AI uses /codefactory.add
// → Factory call saved to codefactory.manifest.json

"add Card component to manifest"  
// → Another factory call added to manifest

"build all from manifest"
// → AI uses /codefactory.produce
// → Files generated with markers for safe regeneration

"show me what's in the manifest"
// → AI uses /codefactory.inspect
// → Displays all factory calls and their parameters
```

## Usage Modes

### 1. Slash Commands

Use Copilot slash commands to work with the manifest system:

```bash
# In VS Code Copilot chat:
/codefactory.add "a 'design_system_component' for Button"
/codefactory.add "a 'design_system_component' for Card that uses Button"
/codefactory.produce
```

**When to use:**
- Working in VS Code with GitHub Copilot
- Quick access to manifest operations
- Prefer explicit command syntax

### 2. Natural Language

Use natural language - Copilot translates to slash commands:

**Phase 1 - Planning** (natural language with Copilot):
```typescript
"add a 'react_component' for Button with label and onClick props"
"add a 'react_component' for Card, depending on Button"
```

**Phase 2 - Building** (natural language or direct code):
```typescript
"build all from manifest"
// OR execute directly:
const producer = new Producer(manifest, registry);
await producer.buildAll();
```

**When to use:**
- Prefer conversational interface
- Let AI interpret intent
- More flexible phrasing

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

**Slash Commands** (explicit):
```bash
/codefactory.add <description>       # Add factory call to manifest
/codefactory.produce                 # Build from manifest (deterministic)
/codefactory.update <id> <params>    # Update factory call
/codefactory.remove <id>             # Remove factory call
/codefactory.inspect                 # Show manifest contents
```

**Natural Language** (conversational):
- **"add X to manifest"** → Uses `/codefactory.add` internally
- **"build from manifest"** → Uses `/codefactory.produce`
- **"update X in manifest"** → Uses `/codefactory.update`
- **"remove X from manifest"** → Uses `/codefactory.remove`
- **"show manifest"** → Uses `/codefactory.inspect`

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
- **`src/create/`** - Project scaffolding CLI (like create-react-app)

```bash
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

- [Creating Factories](./docs/creating-factories.md) - **Define your own code generators**
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
