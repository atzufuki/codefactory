/**
 * Main Application Entry Point
 * 
 * This demonstrates how to use CodeFactory in your project.
 */

import registry from "../factories/index.ts";

console.log("🏭 CodeFactory Project\n");
console.log("=" .repeat(50));

// Show available factories
console.log("\n📋 Available Factories:\n");
const factories = registry.list();
for (const factory of factories) {
  console.log(`  ✓ ${factory.name}`);
  console.log(`    ${factory.description}\n`);
}

console.log("=" .repeat(50));

// Example: Generate code using a factory
console.log("\n📝 Example: Generating a TypeScript function\n");

const factory = registry.get("typescript_function");
if (factory) {
  const result = await factory.execute({
    functionName: "multiply",
    description: "Multiplies two numbers together",
    params: "a: number, b: number",
    returnType: "number",
    body: "return a * b;",
  });

  console.log(`Generated file: ${result.filePath}`);
  console.log(`\nContent:\n${result.content}`);
}

console.log("\n=" .repeat(50));
console.log("\n💡 Next Steps:");
console.log("  1. Edit factories/examples.ts to customize factories");
console.log("  2. Create new factory files and register them");
console.log("  3. Use factories programmatically or let AI discover them");
console.log("\n🤖 AI can discover and use these factories automatically!");
console.log("=" .repeat(50) + "\n");
