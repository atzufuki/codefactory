# My CodeFactory Project

A project powered by [CodeFactory](https://github.com/atzufuki/codefactory) - deterministic AI code generation.

## What is This?

This project uses **CodeFactory**, a system that allows you to define code generation templates (factories) that AI assistants can use to generate consistent, predictable code.

Instead of AI writing code directly (which can be inconsistent), AI calls your predefined factories with parameters. This ensures:
- ✅ Consistent code style
- ✅ Predictable structures
- ✅ Faster generation
- ✅ Easy maintenance

## Project Structure

```
.
├── factories/          # Your code generation templates
│   ├── index.ts       # Main factory registry
│   └── examples.ts    # Example factories to get started
├── src/
│   └── main.ts        # Application entry point
└── deno.json          # Deno configuration
```

## Getting Started

> **Note:** CodeFactory is currently in development. Until it's published to JSR, you'll need to update the import path in `deno.json` to point to a local copy or a GitHub URL.

### 1. Run the project

```bash
deno task dev
```

This will show you the available factories and demonstrate how they work.

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

### 3. Use Factories

Factories can be used:
- **Programmatically** in your code
- **By AI** - AI discovers and calls them based on your natural language requests

## Learn More

- [CodeFactory Documentation](https://github.com/atzufuki/codefactory)
- [Factory Examples](./factories/examples.ts)

## Philosophy

> "Code should be deterministic. AI should be creative. Factories bridge the gap."

---

**Built with Deno 🦕 and CodeFactory 🏭**
