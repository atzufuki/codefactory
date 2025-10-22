/**
 * E2E Test Phase 4: Cleanup
 * 
 * Cleans up test project.
 */

import { join } from "@std/path";

async function getTestProjectDir(): Promise<string> {
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  const path = await Deno.readTextFile(join(tmpDir, "latest-project.txt"));
  return path.trim();
}

Deno.test("E2E Phase 4: Cleanup test project", async () => {
  const testProjectDir = await getTestProjectDir();
  
  console.log("\n🧹 Cleaning up test project...");
  
  try {
    await Deno.remove(testProjectDir, { recursive: true });
    console.log(`✅ Removed ${testProjectDir}`);
  } catch (error) {
    console.warn(`⚠️  Could not remove ${testProjectDir}:`, error);
    // Don't fail the test - cleanup is optional
  }
  
  // Clean up tmp marker file
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  try {
    await Deno.remove(join(tmpDir, "latest-project.txt"));
  } catch {
    // Ignore
  }
});
