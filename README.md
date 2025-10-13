# AI Code Factory 🏭

> A meta-factory for deterministic AI code generation

## The Problem

When AI assistants write code directly, they're *probabilistic* - the same request can produce different results each time. This leads to:

- **Inconsistent code style** across your project
- **Unpredictable structures** that vary slightly each time
- **Slow generation** as AI writes line-by-line
- **Hard-to-maintain** codebases where similar components are implemented differently

## The Solution

**AI Code Factory** shifts the paradigm: instead of AI *writing* code, it *calls* predefined factories with parameters. Think of it as giving AI a set of blueprints instead of asking it to architect from scratch.

### Before (Traditional AI)
```
You: "Create a React list component for users"
AI: *writes 50 lines of code with its own interpretation*
You: "Create a React list component for products"
AI: *writes 50 different lines with a different structure*
```

### After (AI Code Factory)
```
You: "Create a React list component for users"
AI: calls → ListComponentFactory(model: "User", fields: ["name", "email"])
You: "Create a React list component for products"
AI: calls → ListComponentFactory(model: "Product", fields: ["title", "price"])
Result: Identical structure, only data differs
```

## Key Concepts

### 🎯 Deterministic Generation
Same factory + same parameters = always the same code output

### 🧩 Composable Factories
Factories can call other factories to build complex structures from simple building blocks

### 🌍 Language Agnostic
Generate code in any language - Python, TypeScript, Rust, or even SQL

### 🤖 AI-Friendly
AI discovers available factories and chooses the right one based on context

## Quick Example

```typescript
import { Factory, FactoryRegistry } from "@codefactory/core";

// Define a factory for React components
const registry = new FactoryRegistry();

registry.register({
  name: "react_list_component",
  description: "Creates a React component that displays a list of items",
  params: {
    componentName: {
      type: "string",
      description: "Name of the component (e.g., 'UserList')",
      required: true,
    },
    itemType: {
      type: "string",
      description: "TypeScript type for list items",
      required: true,
    },
  },
  examples: [
    { componentName: "UserList", itemType: "User" },
  ],
  generate: ({ componentName, itemType }) => ({
    content: `
interface ${componentName}Props {
  items: ${itemType}[];
}

export function ${componentName}({ items }: ${componentName}Props) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{JSON.stringify(item)}</li>
      ))}
    </ul>
  );
}`,
    filePath: `src/components/${componentName}.tsx`,
  }),
});

// AI can now discover and use this factory
const factory = registry.get("react_list_component");
const result = await factory?.execute({
  componentName: "ProductList",
  itemType: "Product",
});

console.log(result?.content);
```

## How It Works

1. **Developer** defines factories for their project's patterns
2. **Factory Registry** catalogs all available factories
3. **AI** receives the catalog and understands what factories exist
4. **User** makes a natural language request
5. **AI** determines which factory to use and with what parameters
6. **Factory** generates deterministic code
7. **Result** is consistent, fast, and maintainable

## Use Cases

- **Component Libraries**: Define once, generate consistently
- **API Endpoints**: Standardize REST/GraphQL endpoint creation
- **Database Models**: Ensure uniform schema patterns
- **Test Suites**: Generate tests following team conventions
- **Boilerplate Code**: Eliminate repetitive coding tasks

## Why This Matters

### For Developers
- **Control**: You define the patterns, AI follows them
- **Speed**: Factories generate code instantly
- **Consistency**: Same structure across entire codebase

### For Teams
- **Standards**: Enforce coding conventions automatically
- **Onboarding**: New team members use the same patterns
- **Maintenance**: Update factory once, affect all future generations

### For AI
- **Clarity**: Clear contracts instead of ambiguous instructions
- **Reliability**: Reduced chance of errors or hallucinations
- **Efficiency**: Call a function instead of generating tokens

## Project Status

🚧 **Early Development** - This is a conceptual prototype. Core ideas:

- Reduce AI variability through predefined templates
- Enable composition of complex structures from simple factories
- Provide clear protocol for AI-factory communication
- Support any programming language or framework

## Philosophy

> "Code should be deterministic. AI should be creative. Factories bridge the gap."

We're building a tool that combines the best of both worlds:
- The **precision** of traditional programming
- The **intelligence** of AI assistance

## Contributing

This project is in early stages. Ideas, feedback, and contributions welcome!

## License

MIT

---

**Built with Deno 2 🦕 and TypeScript**
