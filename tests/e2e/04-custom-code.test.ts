/**
 * E2E Test Phase 4: Custom Code Preservation
 * 
 * Tests that custom code outside markers is preserved during sync.
 * Depends on: 03-edit-and-sync.test.ts
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { syncTool } from "../../src/mcp-server/tools/sync.ts";

async function getTestProjectDir(): Promise<string> {
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  const path = await Deno.readTextFile(join(tmpDir, "latest-project.txt"));
  return path.trim();
}

Deno.test("E2E Phase 4: Preserve custom code during sync", async () => {
  const testProjectDir = await getTestProjectDir();
  const factoriesPath = join(testProjectDir, "factories");
  const filePath = join(testProjectDir, "src/greet.ts");
  
  console.log("\n➕ Adding custom code outside markers...");
  
  // Read current content
  let content = await Deno.readTextFile(filePath);
  
  // Add custom code AFTER the markers
  content += "\n\n// Custom helper function (outside markers)\n";
  content += "export function greetMany(names: string[]): string[] {\n";
  content += "  return names.map(name => sayHello(name));\n";
  content += "}\n";
  content += "\n// Custom constant\n";
  content += "export const DEFAULT_GREETING = 'Hello';\n";
  
  await Deno.writeTextFile(filePath, content);
  console.log("✓ Custom code added");
  
  // Edit the generated code inside markers
  console.log("\n✏️  Editing generated code again...");
  content = await Deno.readTextFile(filePath);
  const editedContent = content.replace("sayHello", "greetPerson");
  await Deno.writeTextFile(filePath, editedContent);
  console.log("✓ Generated code edited");
  
  // Sync
  console.log("\n🔄 Syncing with custom code...");
  
  const syncResult = await syncTool.execute({
    path: filePath,
    factoriesPath,
  });
  
  assertEquals(
    syncResult.isError,
    undefined,
    "Sync should succeed"
  );
  
  // Verify custom code is preserved
  const syncedContent = await Deno.readTextFile(filePath);
  
  assertStringIncludes(
    syncedContent,
    "greetMany",
    "Custom function should be preserved"
  );
  
  assertStringIncludes(
    syncedContent,
    "DEFAULT_GREETING",
    "Custom constant should be preserved"
  );
  
  assertStringIncludes(
    syncedContent,
    "// Custom helper function",
    "Custom comments should be preserved"
  );
  
  // Verify generated code was updated
  assertStringIncludes(
    syncedContent,
    "greetPerson",
    "Generated code should be updated"
  );
  
  console.log("✅ Custom code preserved, generated code updated");
});
