/**
 * Demo application for testing AI Code Factory
 * 
 * This demonstrates how developers can define their own factories
 * and how AI can discover and use them.
 */

import { FactoryRegistry } from "@codefactory/core";

// Create a registry for this demo project
const registry = new FactoryRegistry();

// Define a simple factory for demo purposes
registry.register({
  name: "greeting_function",
  description: "Creates a TypeScript function that greets a user",
  params: {
    functionName: {
      type: "string",
      description: "Name of the function",
      required: true,
    },
    greeting: {
      type: "string",
      description: "The greeting message",
      required: false,
      default: "Hello",
    },
  },
  examples: [
    { functionName: "greetUser", greeting: "Welcome" },
    { functionName: "sayHi", greeting: "Hi there" },
  ],
  generate: ({ functionName, greeting = "Hello" }) => ({
    content: `
export function ${functionName}(name: string): string {
  return \`${greeting}, \${name}!\`;
}`,
    filePath: `src/greetings/${functionName}.ts`,
  }),
});

// Show what factories are available
console.log("🏭 Available Factories:\n");
for (const factory of registry.list()) {
  console.log(`  - ${factory.name}: ${factory.description}`);
}

// Example: Use a factory programmatically
console.log("\n📝 Generating code with factory:\n");
const factory = registry.get("greeting_function");
if (factory) {
  const result = await factory.execute({
    functionName: "welcomeUser",
    greeting: "Welcome to Code Factory",
  });
  
  console.log(`Generated file: ${result.filePath}`);
  console.log(`Content:${result.content}\n`);
}

// Show factory catalog (what AI would see)
console.log("\n🤖 Factory Catalog (for AI):\n");
console.log(JSON.stringify(registry.getCatalog(), null, 2));
