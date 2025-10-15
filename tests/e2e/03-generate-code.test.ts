/**
 * E2E Test Phase 3: Use Factory to Generate Code
 * 
 * Tests using the newly created factory to generate code.
 * Depends on: 02-create-factory.test.ts
 */

import { assertEquals } from "@std/assert";
import { exists } from "@std/fs";
import { join } from "@std/path";
import { addTool } from "../../src/mcp-server/tools/add.ts";
import { produceTool } from "../../src/mcp-server/tools/produce.ts";

async function getTestProjectDir(): Promise<string> {
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  const path = await Deno.readTextFile(join(tmpDir, "latest-project.txt"));
  return path.trim();
}

Deno.test("E2E Phase 3: Use factory to generate code", async () => {
  const testProjectDir = await getTestProjectDir();
  const manifestPath = join(testProjectDir, "codefactory.manifest.json");
  const factoriesPath = join(testProjectDir, "factories");
  
  console.log("\n➕ Using factory to generate code...");
  
  // Add code generation to manifest
  const addResult = await addTool.execute({
    description: "Create a greet function that says hello",
    id: "test-greeting-function",
    factory: "simple_greeter",
    params: {
      fileName: "greet",
      functionName: "greet",
      params: ["name: string"],
      implementation: 'return `Hello, ${name}!`;',
    },
    outputPath: join(testProjectDir, "src/greet.ts"),
    manifestPath,
    factoriesPath,
  });
  
  assertEquals(
    addResult.content[0].text.includes("Added to manifest"),
    true,
    "Should confirm code added to manifest"
  );
  
  // Build the code
  const produceResult = await produceTool.execute({
    manifestPath,
    factoriesPath,
  });
  
  assertEquals(
    produceResult.content[0].text.includes("✅"),
    true,
    "Should confirm successful build"
  );
  
  // Verify generated file
  const generatedFilePath = join(testProjectDir, "src/greet.ts");
  const generatedFileExists = await exists(generatedFilePath);
  assertEquals(generatedFileExists, true, "Generated file should exist");
  
  const generatedContent = await Deno.readTextFile(generatedFilePath);
  
  assertEquals(
    generatedContent.includes("function greet"),
    true,
    "Generated code should contain greet function"
  );
  
  assertEquals(
    generatedContent.includes("// @codefactory:start"),
    true,
    "Generated code should have markers"
  );
  
  assertEquals(
    generatedContent.includes("name: string"),
    true,
    "Generated code should have correct parameter"
  );
  
  console.log("✅ Code generated successfully");
});
