/**
 * E2E Test Phase 2: Create Factory with Meta-Factory
 * 
 * Tests creating a factory using the meta-factory.
 * Depends on: 01-bootstrap.test.ts
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { exists } from "@std/fs";
import { join } from "@std/path";
import { FactoryRegistry } from "../../src/codefactory/registry.ts";
import { Producer } from "../../src/codefactory/producer.ts";

async function getTestProjectDir(): Promise<string> {
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  const path = await Deno.readTextFile(join(tmpDir, "latest-project.txt"));
  return path.trim();
}

Deno.test("E2E Phase 2: Create factory using meta-factory", async () => {
  const testProjectDir = await getTestProjectDir();
  const factoriesDir = join(testProjectDir, "factories");
  
  console.log("\n��� Creating 'greeter' factory with meta-factory...");
  
  const registry = new FactoryRegistry();
  await registry.registerBuiltIns();
  const producer = new Producer(registry);
  
  const greeterFactoryParams = {
    name: "greeter",
    description: "Creates a greeting function",
    template: "export function {{functionName}}(name: string): string {\\n  return \`{{message}}, \${name}!\`;\\n}",
    outputPath: "src/{{functionName}}.ts"
  };
  
  const greeterFactoryPath = join(factoriesDir, "greeter.codefactory");
  await producer.createFile("factory", greeterFactoryParams, greeterFactoryPath);
  
  const factoryExists = await exists(greeterFactoryPath);
  assertEquals(factoryExists, true, "Greeter factory file should be created");
  
  const factoryContent = await Deno.readTextFile(greeterFactoryPath);
  assertEquals(
    factoryContent.includes("/** @codefactory"),
    false,
    "Factory should NOT have JSDoc metadata"
  );
  
  assertStringIncludes(factoryContent, "name: greeter", "Should have correct name");
  assertStringIncludes(factoryContent, "export function {{functionName}}", "Should have template");
  
  console.log("✓ Greeter factory created successfully");
});
