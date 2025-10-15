/**
 * E2E Test Phase 5: Remove and Cleanup
 * 
 * Tests removing factory calls and cleaning up test project.
 * Depends on: 04-update-rebuild.test.ts
 */

import { assertEquals } from "@std/assert";
import { exists } from "@std/fs";
import { join } from "@std/path";
import { removeTool } from "../../src/mcp-server/tools/remove.ts";
import { inspectTool } from "../../src/mcp-server/tools/inspect.ts";

async function getTestProjectDir(): Promise<string> {
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  const path = await Deno.readTextFile(join(tmpDir, "latest-project.txt"));
  return path.trim();
}

Deno.test("E2E Phase 5: Remove factory call and cleanup", async () => {
  const testProjectDir = await getTestProjectDir();
  const manifestPath = join(testProjectDir, "codefactory.manifest.json");
  
  console.log("\n🗑️  Removing factory call...");
  
  // Remove the code generation factory call
  const removeResult = await removeTool.execute({
    id: "test-greeting-function",
    manifestPath,
  });
  
  assertEquals(
    removeResult.content[0].text.includes("Removed from manifest"),
    true,
    "Should confirm removal"
  );
  
  // Verify only meta-factory remains
  const inspectResult = await inspectTool.execute({ manifestPath });
  assertEquals(
    inspectResult.content[0].text.includes("Total factory calls: 1"),
    true,
    "Should show 1 factory call (meta-factory remains)"
  );
  
  // Verify generated file still exists (safety feature)
  const generatedFilePath = join(testProjectDir, "src/greet.ts");
  const fileStillExists = await exists(generatedFilePath);
  assertEquals(
    fileStillExists,
    true,
    "Generated file should still exist (safety feature)"
  );
  
  console.log("✅ Removal successful");
  
  // Cleanup test project
  console.log("\n🧹 Cleaning up test project...");
  try {
    await Deno.remove(testProjectDir, { recursive: true });
    console.log("✅ Test project cleaned up");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  Failed to cleanup: ${message}`);
  }
  
  // Remove the project path file
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  try {
    await Deno.remove(join(tmpDir, "latest-project.txt"));
  } catch {
    // Ignore if file doesn't exist
  }
});
