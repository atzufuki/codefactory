/**
 * E2E Test Phase 3: Edit and Sync
 * 
 * Tests manual code editing and extraction-based sync.
 * Depends on: 02-create-file.test.ts
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { syncTool } from "../../src/mcp-server/tools/sync.ts";

async function getTestProjectDir(): Promise<string> {
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  const path = await Deno.readTextFile(join(tmpDir, "latest-project.txt"));
  return path.trim();
}

Deno.test("E2E Phase 3: Edit code and sync", async () => {
  const testProjectDir = await getTestProjectDir();
  const factoriesPath = join(testProjectDir, "factories");
  const filePath = join(testProjectDir, "src/greet.ts");
  
  console.log("\n✏️  Editing generated code...");
  
  // Read current content
  const originalContent = await Deno.readTextFile(filePath);
  
  // Simulate user editing the code (change function name and message)
  const editedContent = originalContent
    .replace("function greet(", "function sayHello(")
    .replace("Welcome", "Greetings");
  
  await Deno.writeTextFile(filePath, editedContent);
  console.log("✓ Code edited (changed function name and message)");
  
  // Sync to extract changes and regenerate
  console.log("\n🔄 Syncing file...");
  
  const syncResult = await syncTool.execute({
    path: filePath,
    factoriesPath,
  });
  
  assertEquals(
    syncResult.isError,
    undefined,
    "Sync should succeed"
  );
  
  assertStringIncludes(
    syncResult.content[0].text || "",
    "Synced",
    "Should confirm sync"
  );
  
  // Verify file still contains edited changes
  const syncedContent = await Deno.readTextFile(filePath);
  
  assertStringIncludes(
    syncedContent,
    "sayHello",
    "Should preserve edited function name"
  );
  
  assertStringIncludes(
    syncedContent,
    "Greetings",
    "Should preserve edited message"
  );
  
  assertStringIncludes(
    syncedContent,
    '// @codefactory:start factory="greeter"',
    "Should still have markers"
  );
  
  console.log("✅ Code edited and synced successfully");
  console.log("   Parameters extracted: functionName=sayHello, message=Greetings");
});
