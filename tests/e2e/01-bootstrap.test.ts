/**
 * E2E Test Phase 1: Project Bootstrap
 * 
 * Tests project creation with the create package.
 * New extraction-based workflow (no manifest.json).
 */

import { assertEquals, assertExists } from "@std/assert";
import { exists } from "@std/fs";
import { join } from "@std/path";

Deno.test("E2E Phase 1: Bootstrap project (extraction-based)", async () => {
  const testProjectName = `test-project-${Date.now()}`;
  const tmpDir = join(Deno.cwd(), "tests", "e2e", ".tmp");
  await Deno.mkdir(tmpDir, { recursive: true });
  const testProjectDir = join(tmpDir, testProjectName);
  
  try {
    console.log("\n📦 Bootstrapping project...");
    
    const createProcess = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-read",
        "--allow-write",
        "src/create/mod.ts",
        testProjectDir,
      ],
      cwd: Deno.cwd(),
      stdout: "piped",
      stderr: "piped",
    });
    
    const createResult = await createProcess.output();
    
    if (createResult.code !== 0) {
      const stderr = new TextDecoder().decode(createResult.stderr);
      console.error("Create failed:", stderr);
    }
    
    assertEquals(createResult.code, 0, "Create command should succeed");
    
    const projectExists = await exists(testProjectDir);
    assertEquals(projectExists, true, "Project directory should exist");
    
    // Verify key files (extraction-based workflow)
    const expectedFiles = [
      "deno.json",
      "README.md",
      "factories/index.ts",
      "src/main.ts",
      ".vscode/settings.json",
      ".vscode/mcp.json",
      ".github/copilot-instructions.md",
      ".github/prompts/codefactory.create.prompt.md",
      ".github/prompts/codefactory.sync.prompt.md",
    ];
    
    for (const file of expectedFiles) {
      const fileExists = await exists(join(testProjectDir, file));
      assertEquals(fileExists, true, `File ${file} should exist`);
    }
    
    // Verify manifest.json does NOT exist (extraction-based workflow)
    const manifestExists = await exists(join(testProjectDir, "codefactory.manifest.json"));
    assertEquals(manifestExists, false, "Manifest should NOT exist in extraction workflow");
    
    // Verify MCP configuration
    const denoJson = JSON.parse(
      await Deno.readTextFile(join(testProjectDir, "deno.json"))
    );
    assertExists(denoJson.tasks["mcp:dev"], "MCP dev task should exist");
    
    const mcpConfig = JSON.parse(
      await Deno.readTextFile(join(testProjectDir, ".vscode/mcp.json"))
    );
    assertExists(
      mcpConfig.servers?.codefactory,
      "VS Code should have MCP server configuration"
    );
    assertEquals(
      mcpConfig.servers.codefactory.type,
      "stdio",
      "MCP server should use stdio transport"
    );
    
    // Verify copilot-instructions.md mentions extraction workflow
    const copilotInstructions = await Deno.readTextFile(
      join(testProjectDir, ".github/copilot-instructions.md")
    );
    assertEquals(
      copilotInstructions.includes("extraction-based"),
      true,
      "Instructions should mention extraction-based workflow"
    );
    assertEquals(
      copilotInstructions.includes("source of truth"),
      true,
      "Instructions should explain code as source of truth"
    );
    
    console.log("✅ Project bootstrapped successfully (extraction-based)");
    
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
