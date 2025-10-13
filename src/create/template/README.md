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

### 3. Use Factories with AI

This project is configured for **GitHub Copilot** integration. Copilot can automatically use your factories!

**Available Commands** (in Copilot Chat):
- `/codefactory.list` - Show all available factories
- `/codefactory.produce <factory_name>` - Produce code using a factory

**How to use (multiple ways):**

1. **Natural language** (easiest):
   ```
   You: "Create a TypeScript function called validateEmail that takes a string and returns boolean"
   Copilot: Automatically uses typescript_function factory with correct parameters
   ```

2. **Explicit command**:
   ```
   You: "/codefactory.produce typescript_function with name validateEmail, params email: string, returns boolean"
   Copilot: Executes factory with specified parameters
   ```

3. **Interactive**:
   ```
   You: "I need an API endpoint for users"
   Copilot: "I'll use api_endpoint factory. What HTTP method? (GET/POST/PUT/DELETE)"
   You: "GET"
   Copilot: Produces the endpoint
   ```

**Creating new factories:**
```
You: "I need a factory for React components with props"
Copilot: Uses /codefactory.produce define_factory to create it
```

💡 **Tip**: Just describe what you want in natural language. Copilot will figure out which factory to use and what parameters it needs!

The AI automatically:
- ✅ Discovers your factories
- ✅ Chooses the right factory for the task
- ✅ Validates parameters
- ✅ Generates consistent code

### 4. Use Factories Programmatically

You can also use factories directly in code:

```typescript
import { registry } from "./factories/index.ts";

const factory = registry.get("typescript_function");
const result = await factory.execute({
  functionName: "validateEmail",
  params: "email: string",
  returnType: "boolean",
});

console.log(result.code);
```

## Learn More

- [CodeFactory Documentation](https://github.com/atzufuki/codefactory)
- [Factory Examples](./factories/examples.ts)
- [GitHub Copilot Instructions](./.github/copilot-instructions.md)

## Philosophy

> "Code should be deterministic. AI should be creative. Factories bridge the gap."

---

**Built with Deno 🦕 and CodeFactory 🏭**
