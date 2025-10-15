# My CodeFactory Project

A project powered by [CodeFactory](https://github.com/atzufuki/codefactory) - deterministic code generation with two-phase AI workflow.

## What is This?

This project uses **CodeFactory**, a system for deterministic code generation with a **two-phase approach**:

1. **Planning** (with AI): Parse intent → Add to manifest
2. **Building** (deterministic): Execute manifest → Generate code

This ensures:
- ✅ Same manifest = Same code, always
- ✅ Fast rebuilding without AI inference
- ✅ Version control the "recipe" not the output
- ✅ Factory updates benefit all projects

## Project Structure

```
.
├── codefactory.manifest.json  # Build manifest (like package.json)
├── factories/                 # Your code generation templates
│   ├── index.ts              # Main factory registry
│   └── examples.ts           # Example factories to get started
├── examples/
│   └── example-workflow.ts   # Manifest system demo
├── src/
│   └── main.ts               # Application entry point
└── deno.json                 # Deno configuration
```

## Getting Started

> **Note:** CodeFactory is currently in development. Until it's published to JSR, you'll need to update the import path in `deno.json` to point to a local copy or a GitHub URL.

### 1. Run the example workflow

```bash
deno run --allow-read --allow-write examples/example-workflow.ts
```

This demonstrates the manifest system in action:
- Adds factory calls to manifest
- Shows execution order with dependencies
- Performs dry-run preview
- Builds all from manifest

### 2. Define Your Own Factories

Edit `factories/examples.ts` or create new factory files:

```typescript
import { defineFactory } from "@codefactory/core";

export const myFactory = defineFactory({
  name: "my_component",
  description: "Creates a custom component",
  template: `
export class {{componentName}} {
  constructor(public {{props}}) {}
}`,
  outputPath: "src/{{componentName}}.ts",
  params: {
    componentName: {
      description: "Name of the component",
      required: true,
    },
    props: {
      description: "Constructor properties",
      required: true,
    },
  },
});
```

### 3. Use with GitHub Copilot

This project is configured for **GitHub Copilot** integration with both slash commands and natural language.

**Slash Commands**:
```bash
/codefactory.add <description>       # Add factory call to manifest
/codefactory.produce                 # Build from manifest (deterministic)
/codefactory.update <id> <params>    # Update factory call in manifest
/codefactory.remove <id>             # Remove factory call from manifest
/codefactory.inspect                 # Show manifest contents
```

**Natural Language** (also uses manifest system):

1. **Add to manifest** (planning phase):
   ```
   You: "Add a TypeScript function called validateEmail to manifest"
   Copilot: Uses /codefactory.add → Adds factory call to manifest
   ```

2. **Build from manifest** (execution phase):
   ```
   You: "Build all from manifest"
   Copilot: Uses /codefactory.produce → Executes all factory calls
   ```

3. **Other operations**:
   ```
   You: "Update validateEmail in manifest"
   Copilot: Uses /codefactory.update
   
   You: "Remove validateEmail from manifest"
   Copilot: Uses /codefactory.remove
   
   You: "Show me the manifest"
   Copilot: Uses /codefactory.inspect
   ```

💡 **Tip**: All commands work through the manifest system for deterministic, reproducible builds!

The AI automatically:
- ✅ Discovers your factories
- ✅ Chooses the right factory for the task
- ✅ Validates parameters
- ✅ Generates consistent code

### 4. Use Programmatically

You can also use the manifest system directly in code:

```typescript
import { ManifestManager, Producer, FactoryRegistry } from "@codefactory/core";

// Load manifest
const manager = await ManifestManager.load("./codefactory.manifest.json");

// Add factory call
manager.addFactoryCall({
  id: "validate-email",
  factory: "typescript_function",
  params: {
    functionName: "validateEmail",
    params: "email: string",
    returnType: "boolean",
  },
  outputPath: "src/validators.ts",
});
await manager.save();

// Build from manifest
const registry = new FactoryRegistry();
await registry.autoRegister("./factories");
const producer = new Producer(manager.getManifest(), registry);
const result = await producer.buildAll();

console.log(`Generated ${result.generated.length} files`);
```

## Learn More

- [CodeFactory Documentation](https://github.com/atzufuki/codefactory)
- [Manifest System Guide](https://github.com/atzufuki/codefactory/blob/main/docs/manifest-system.md)
- [Manifest Examples](./examples/MANIFEST_EXAMPLES.md)
- [Factory Examples](./factories/examples.ts)

## Philosophy

> "Same manifest, same code. Always."

Deterministic code generation through separation of planning (AI) and building (deterministic).

---

**Built with Deno 🦕 and CodeFactory 🏭**
