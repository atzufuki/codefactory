/**
 * Demo application for testing AI Code Factory
 * 
 * This demonstrates how developers can define their own factories
 * and how AI can discover and use them.
 */

import { builtInFactories, defineFactory, FactoryRegistry } from "@codefactory/core";

// Create a registry for this demo project
const registry = new FactoryRegistry();

// Register built-in factories (including the meta-factory!)
console.log("🔧 Registering built-in factories...\n");
for (const factory of builtInFactories) {
  registry.register(factory);
  console.log(`  ✓ Registered: ${factory.name}`);
}

console.log("\n=== Demo 1: Simple Template-Based Factory ===\n");

// Simple greeting function factory using templates
registry.register(
  defineFactory({
    name: "greeting_function",
    description: "Creates a TypeScript function that greets a user",
    template: `export function {{functionName}}(name: string): string {
  return \`{{greeting}}, \${name}!\`;
}`,
    outputPath: "src/greetings/{{functionName}}.ts",
    params: {
      functionName: {
        description: "Name of the function",
        required: true,
      },
      greeting: {
        description: "The greeting message",
        required: false,
        default: "Hello",
      },
    },
    examples: [
      { functionName: "greetUser", greeting: "Welcome" },
      { functionName: "sayHi", greeting: "Hi there" },
    ],
  })
);

console.log("\n=== Demo 2: Complex Template-Based Factory ===\n");

// More complex React component factory
registry.register(
  defineFactory({
    name: "react_component",
    description: "Creates a React functional component",
    template: `interface {{componentName}}Props {
  {{propsDefinition}}
}

export function {{componentName}}({ {{propsList}} }: {{componentName}}Props) {
  return (
    <div className="{{componentName}}">
      {{children}}
    </div>
  );
}`,
    outputPath: "src/components/{{componentName}}.tsx",
    params: {
      componentName: {
        description: "Name of the component (e.g., 'UserCard')",
        required: true,
      },
      propsDefinition: {
        description: "TypeScript props definition (e.g., 'name: string')",
        required: true,
      },
      propsList: {
        description: "Comma-separated prop names (e.g., 'name, age')",
        required: true,
      },
      children: {
        description: "JSX content inside the component",
        required: false,
        default: "<p>Hello World</p>",
      },
    },
    examples: [
      {
        componentName: "UserCard",
        propsDefinition: "name: string; email: string",
        propsList: "name, email",
        children: "<h1>{name}</h1><p>{email}</p>",
      },
    ],
  })
);

// Show what factories are available
console.log("🏭 Available Factories:\n");
for (const factory of registry.list()) {
  console.log(`  - ${factory.name}: ${factory.description}`);
}

// Example 1: Use simple template factory
console.log("\n📝 Example 1: Using greeting_function factory:\n");
const greetingFactory = registry.get("greeting_function");
if (greetingFactory) {
  const result = await greetingFactory.execute({
    functionName: "welcomeUser",
    greeting: "Welcome to Code Factory",
  });
  
  console.log(`Generated file: ${result.filePath}`);
  console.log(`Content:${result.content}\n`);
}

// Example 2: Use complex template factory
console.log("📝 Example 2: Using react_component factory:\n");
const reactFactory = registry.get("react_component");
if (reactFactory) {
  const result = await reactFactory.execute({
    componentName: "ProductCard",
    propsDefinition: "title: string; price: number",
    propsList: "title, price",
    children: "<h2>{title}</h2><p>${price}</p>",
  });
  
  console.log(`Generated file: ${result.filePath}`);
  console.log(`Content:${result.content}\n`);
}

// Example 3: Use the meta-factory to CREATE a new factory!
console.log("📝 Example 3: Using the meta-factory (define_factory) to create a NEW factory:\n");
const metaFactory = registry.get("define_factory");
if (metaFactory) {
  const result = await metaFactory.execute({
    name: "api_endpoint",
    description: "Creates a REST API endpoint handler",
    template: "export async function {{handlerName}}(req: Request): Promise<Response> {\n  // {{description}}\n  return new Response(JSON.stringify({ message: '{{message}}' }));\n}",
    outputPath: "api/{{handlerName}}.ts",
    paramDescriptions: {
      handlerName: "Name of the handler function",
      description: "What this endpoint does",
      message: "Default response message",
    },
  });
  
  console.log(`Generated file: ${result.filePath}`);
  console.log(`Content:${result.content}\n`);
  console.log("💡 This generated code defines a NEW factory that can be registered and used!");
}

// Show factory catalog (what AI would see)
console.log("\n🤖 Factory Catalog (for AI):\n");
const catalog = registry.getCatalog();
console.log(`Found ${catalog.length} factories:\n`);
for (const factory of catalog) {
  console.log(`\n${factory.name}:`);
  console.log(`  Description: ${factory.description}`);
  console.log(`  Parameters: ${Object.keys(factory.params).join(", ")}`);
}
