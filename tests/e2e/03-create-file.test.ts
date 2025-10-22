/**
 * E2E Test Phase 3: Create File with Factory
 * 
 * Tests using MCP create tool to generate a new file using the 'greeter' factory
 * created in Phase 2.
 * Depends on: 01-bootstrap.test.ts, 02-create-factory.test.ts
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { exists } from "@std/fs";
import { join } from "@std/path";
import { createTool } from "../../src/mcp-server/tools/create.ts";

async function getTestProjectDir(): Promise<string> {
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  const path = await Deno.readTextFile(join(tmpDir, "latest-project.txt"));
  return path.trim();
}

Deno.test("E2E Phase 3: Create file using greeter factory", async () => {
  const testProjectDir = await getTestProjectDir();
  const factoriesPath = join(testProjectDir, "factories");
  
  console.log("\n📝 Creating file with 'greeter' factory from Phase 2...");
  
  // The 'greeter' factory was created in Phase 2 by the meta-factory
  // Now we use it to create a file via MCP tool
  const outputPath = join(testProjectDir, "src/greet.ts");
  const createResult = await createTool.execute({
    factory: "greeter",
    params: {
      functionName: "greet",
      message: "Welcome",
    },
    outputPath,
    factoriesPath,
  });
  
  assertEquals(
    createResult.isError,
    undefined,
    "Create should succeed"
  );
  
  assertStringIncludes(
    createResult.content[0].text || "",
    "✅",
    "Should confirm successful creation"
  );
  
  assertStringIncludes(
    createResult.content[0].text || "",
    "greet.ts",
    "Should mention output file"
  );
  
  // Verify file was created
  const fileExists = await exists(outputPath);
  assertEquals(fileExists, true, "Output file should exist");
  
  const fileContent = await Deno.readTextFile(outputPath);
  
  // Verify JSDoc metadata format
  assertStringIncludes(
    fileContent,
    '/**',
    "File should have JSDoc metadata block"
  );
  
  assertStringIncludes(
    fileContent,
    ' * @codefactory greeter',
    "File should have @codefactory annotation with factory name"
  );
  
  assertStringIncludes(
    fileContent,
    ' */',
    "File should have JSDoc end"
  );
  
  // Verify generated code
  assertStringIncludes(
    fileContent,
    "export function greet(name: string): string",
    "Should have correct function signature"
  );
  
  assertStringIncludes(
    fileContent,
    "Welcome",
    "Should have custom message"
  );
  
  console.log("✅ File created successfully with JSDoc metadata using meta-factory-created greeter factory");
});
