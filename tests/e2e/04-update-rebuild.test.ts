/**
 * E2E Test Phase 4: Update and Rebuild
 * 
 * Tests updating factory call parameters and rebuilding.
 * Depends on: 03-generate-code.test.ts
 */

import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { updateTool } from "../../src/mcp-server/tools/update.ts";
import { produceTool } from "../../src/mcp-server/tools/produce.ts";
import { inspectTool } from "../../src/mcp-server/tools/inspect.ts";

async function getTestProjectDir(): Promise<string> {
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  const path = await Deno.readTextFile(join(tmpDir, "latest-project.txt"));
  return path.trim();
}

Deno.test("E2E Phase 4: Update factory call and rebuild", async () => {
  const testProjectDir = await getTestProjectDir();
  const manifestPath = join(testProjectDir, "codefactory.manifest.json");
  const factoriesPath = join(testProjectDir, "factories");
  
  console.log("\n🔄 Updating factory call parameters...");
  
  // Update parameters
  const updateResult = await updateTool.execute({
    id: "test-greeting-function",
    updates: {
      params: {
        fileName: "greet",
        functionName: "greet",
        params: ["name: string", "greeting: string"],
        implementation: 'return `${greeting}, ${name}!`;',
      },
    },
    manifestPath,
  });
  
  assertEquals(
    updateResult.content[0].text.includes("Updated in manifest"),
    true,
    "Should confirm update"
  );
  
  // Rebuild
  const rebuildResult = await produceTool.execute({
    manifestPath,
    factoriesPath,
  });
  
  assertEquals(
    rebuildResult.content[0].text.includes("✅"),
    true,
    "Should confirm successful rebuild"
  );
  
  // Verify updated content
  const generatedFilePath = join(testProjectDir, "src/greet.ts");
  const updatedContent = await Deno.readTextFile(generatedFilePath);
  
  assertEquals(
    updatedContent.includes("greeting: string"),
    true,
    "Updated code should have new parameter"
  );
  
  // Verify manifest shows both factory calls
  const inspectResult = await inspectTool.execute({ manifestPath });
  assertEquals(
    inspectResult.content[0].text.includes("Total factory calls: 2"),
    true,
    "Should show 2 factory calls"
  );
  
  console.log("✅ Update and rebuild successful");
});
