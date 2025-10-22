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

Deno.test("E2E Phase 3: Edit metadata and sync", async () => {
  const testProjectDir = await getTestProjectDir();
  const factoriesPath = join(testProjectDir, "factories");
  const filePath = join(testProjectDir, "src/greet.ts");
  
  console.log("\n✏️  Editing metadata...");
  
  // Read current content
  const originalContent = await Deno.readTextFile(filePath);
  
  // Simulate user editing the metadata (change function name and message)
  const editedContent = originalContent
    .replace("functionName: greet", "functionName: sayHello")
    .replace("message: Welcome", "message: Greetings");
  
  await Deno.writeTextFile(filePath, editedContent);
  console.log("✓ Metadata edited (changed functionName and message params)");
  
  // Sync to regenerate code with new params
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
  
  // Verify file contains regenerated code with new params
  const syncedContent = await Deno.readTextFile(filePath);
  
  assertStringIncludes(
    syncedContent,
    "sayHello",
    "Should have new function name from metadata"
  );
  
  assertStringIncludes(
    syncedContent,
    "Greetings",
    "Should have new message from metadata"
  );
  
  assertStringIncludes(
    syncedContent,
    '@codefactory greeter',
    "Should still have JSDoc metadata"
  );
  
  console.log("✅ Metadata edited and code regenerated successfully");
  console.log("   New params: functionName=sayHello, message=Greetings");
});
