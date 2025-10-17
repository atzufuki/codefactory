/**
 * E2E Test Phase 2: Create File with Factory
 * 
 * Tests using MCP create tool to generate a new file.
 * Depends on: 01-bootstrap.test.ts
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

Deno.test("E2E Phase 2: Create file using factory", async () => {
  const testProjectDir = await getTestProjectDir();
  const factoriesPath = join(testProjectDir, "factories");
  
  console.log("\n📝 Creating file with factory...");
  
  // First, create a simple test factory
  const testFactoryPath = join(factoriesPath, "greeter.hbs");
  await Deno.writeTextFile(
    testFactoryPath,
    `---
name: greeter
description: Creates a greeting function
params:
  functionName:
    type: string
    required: true
  message:
    type: string
    required: true
---
export function {{functionName}}(name: string): string {
  return \`{{message}}, \${name}!\`;
}
`
  );
  
  console.log("✓ Test factory created");
  
  // Create a file using the factory via MCP tool
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
  
  // Verify new marker format
  assertStringIncludes(
    fileContent,
    '// @codefactory:start factory="greeter"',
    "File should have new marker format"
  );
  
  assertStringIncludes(
    fileContent,
    "// @codefactory:end",
    "File should have end marker"
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
  
  console.log("✅ File created successfully with extraction markers");
});
