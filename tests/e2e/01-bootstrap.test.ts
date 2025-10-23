/**
 * E2E Test Phase 1: Project Bootstrap
 * 
 * Tests project creation with CLI init command.
 */

import { assertEquals, assertExists } from "@std/assert";
import { exists } from "@std/fs";
import { join } from "@std/path";

Deno.test("E2E Phase 1: Bootstrap project (metadata-based)", async () => {
  const testProjectName = `test-project-${Date.now()}`;
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  await Deno.mkdir(tmpDir, { recursive: true });
  const testProjectDir = join(tmpDir, testProjectName);
  
  try {
    console.log("\n📦 Bootstrapping project with CLI init...");
    
    const initProcess = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "src/cli/main.ts",
        "init",
        testProjectDir,
      ],
      cwd: Deno.cwd(),
      stdout: "piped",
      stderr: "piped",
    });
    
    const initResult = await initProcess.output();
    
    if (initResult.code !== 0) {
      const stderr = new TextDecoder().decode(initResult.stderr);
      console.error("Init failed:", stderr);
    }
    
    assertEquals(initResult.code, 0, "Init command should succeed");
    
    const projectExists = await exists(testProjectDir);
    assertEquals(projectExists, true, "Project directory should exist");
    
    // Verify key files (metadata-based workflow)
    const expectedFiles = [
      "README.md",
      ".gitignore",
      ".codefactory.json",
      "factories/example_component.codefactory",
      ".vscode/settings.json",
      ".github/copilot-instructions.md",
      ".github/prompts/codefactory.create.prompt.md",
      ".github/prompts/codefactory.sync.prompt.md",
    ];
    
    for (const file of expectedFiles) {
      const fileExists = await exists(join(testProjectDir, file));
      assertEquals(fileExists, true, `File ${file} should exist`);
    }
    
    // Verify .codefactory.json configuration
    const config = JSON.parse(
      await Deno.readTextFile(join(testProjectDir, ".codefactory.json"))
    );
    assertExists(config.factoriesDir, "Config should have factoriesDir");
    assertEquals(config.factoriesDir, "factories", "factoriesDir should be 'factories'");
    
    // Verify copilot-instructions.md mentions metadata workflow
    const copilotInstructions = await Deno.readTextFile(
      join(testProjectDir, ".github/copilot-instructions.md")
    );
    assertEquals(
      copilotInstructions.includes("metadata"),
      true,
      "Instructions should mention metadata-based workflow"
    );
    assertEquals(
      copilotInstructions.includes("source of truth"),
      true,
      "Instructions should explain code as source of truth"
    );
    
    console.log("✅ Project bootstrapped successfully (metadata-based)");
    
    // Save project path for next tests
    await Deno.writeTextFile(
      join(tmpDir, "latest-project.txt"),
      testProjectDir
    );
    
  } catch (error) {
    // Cleanup on failure
    try {
      await Deno.remove(testProjectDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
});
