/**
 * E2E Test Phase 2: Create Factory via Meta-Factory
 * 
 * Tests using MCP add and produce tools to create a new factory.
 * Depends on: 01-bootstrap.test.ts
 */

import { assertEquals } from "@std/assert";
import { exists } from "@std/fs";
import { join } from "@std/path";
import { addTool } from "../../src/mcp-server/tools/add.ts";
import { produceTool } from "../../src/mcp-server/tools/produce.ts";
import { inspectTool } from "../../src/mcp-server/tools/inspect.ts";

async function getTestProjectDir(): Promise<string> {
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  const path = await Deno.readTextFile(join(tmpDir, "latest-project.txt"));
  return path.trim();
}

Deno.test("E2E Phase 2: Create factory using meta-factory", async () => {
  const testProjectDir = await getTestProjectDir();
  const manifestPath = join(testProjectDir, "codefactory.manifest.json");
  const factoriesPath = join(testProjectDir, "factories");
  
  console.log("\n🏭 Creating factory via meta-factory...");
  
  // Add factory call to manifest
  const addResult = await addTool.execute({
    description: "Create a factory called simple_greeter that generates greeting functions",
    id: "create-greeter-factory",
    factory: "factory",
    params: {
      name: "simple_greeter",
      description: "Creates a simple greeting function",
      outputPath: "src/{{fileName}}.ts",
      template: `export function {{functionName}}({{#each params}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}) {
  {{implementation}}
}`,
    },
    outputPath: join(testProjectDir, "factories/simple_greeter.hbs"),
    manifestPath,
    factoriesPath,
  });
  
  assertEquals(
    addResult.content[0].text.includes("Added to manifest"),
    true,
    "Should confirm factory call added"
  );
  
  // Build the factory
  const produceResult = await produceTool.execute({
    manifestPath,
    factoriesPath,
  });
  
  assertEquals(
    produceResult.content[0].text.includes("✅"),
    true,
    "Should confirm successful build"
  );
  
  // Verify factory file was created
  const factoryFilePath = join(testProjectDir, "factories/simple_greeter.hbs");
  const factoryFileExists = await exists(factoryFilePath);
  assertEquals(factoryFileExists, true, "Factory file should exist");
  
  const factoryContent = await Deno.readTextFile(factoryFilePath);
  assertEquals(
    factoryContent.includes("name: simple_greeter"),
    true,
    "Factory should have correct name"
  );
  
  assertEquals(
    factoryContent.includes("{{!-- @codefactory:start"),
    true,
    "Factory should have Handlebars-style markers"
  );
  
  // Verify manifest shows the factory
  const inspectResult = await inspectTool.execute({ manifestPath });
  assertEquals(
    inspectResult.content[0].text.includes("create-greeter-factory"),
    true,
    "Manifest should show the factory"
  );
  
  console.log("✅ Factory created successfully");
});
