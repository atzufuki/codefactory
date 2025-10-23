import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { initCommand } from "../commands/init.ts";

Deno.test("initCommand - creates factory directory and files", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const exitCode = await initCommand({ _: ["init", tempDir] });
    
    // Should succeed
    assertEquals(exitCode, 0);
    
    // Check that factories directory was created
    const factoriesDir = join(tempDir, "factories");
    const stat = await Deno.stat(factoriesDir);
    assertEquals(stat.isDirectory, true);
    
    // Check that example template was created
    const examplePath = join(factoriesDir, "example_component.hbs");
    const exampleStat = await Deno.stat(examplePath);
    assertEquals(exampleStat.isFile, true);
    
    // Check that config was created
    const configPath = join(tempDir, ".codefactory.json");
    const configStat = await Deno.stat(configPath);
    assertEquals(configStat.isFile, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("initCommand - fails if directory already initialized", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    // Initialize once
    const exitCode1 = await initCommand({ _: ["init", tempDir] });
    assertEquals(exitCode1, 0);
    
    // Try to initialize again - should fail with exit code 1
    const exitCode2 = await initCommand({ _: ["init", tempDir] });
    assertEquals(exitCode2, 1);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
