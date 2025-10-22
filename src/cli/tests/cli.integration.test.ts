/**
 * Integration tests for CLI commands
 * 
 * These tests run the CLI as a subprocess to test end-to-end functionality
 */

import { assertEquals } from "@std/assert";
import { join } from "@std/path";

const CLI_PATH = join(Deno.cwd(), "src", "cli", "main.ts");

async function runCLI(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-read", "--allow-write", "--allow-env", CLI_PATH, ...args],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();
  
  return { 
    code, 
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr)
  };
}

Deno.test("CLI - help command shows usage", async () => {
  const result = await runCLI(["help"]);
  
  assertEquals(result.code, 0);
  assertEquals(result.stdout.includes("codefactory v0.1.0"), true);
  assertEquals(result.stdout.includes("USAGE:"), true);
  assertEquals(result.stdout.includes("COMMANDS:"), true);
});

Deno.test("CLI - version flag shows version", async () => {
  const result = await runCLI(["--version"]);
  
  assertEquals(result.code, 0);
  assertEquals(result.stdout.trim(), "codefactory v0.1.0");
});

Deno.test("CLI - init command creates project structure", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const result = await runCLI(["init", tempDir]);
    
    assertEquals(result.code, 0);
    assertEquals(result.stdout.includes("✓ Created factories/ with example template"), true);
    assertEquals(result.stdout.includes("✓ Created README.md"), true);
    
    // Verify files were created
    const factoriesDir = join(tempDir, "factories");
    const stat = await Deno.stat(factoriesDir);
    assertEquals(stat.isDirectory, true);
    
    const examplePath = join(factoriesDir, "example_component.hbs");
    const exampleStat = await Deno.stat(examplePath);
    assertEquals(exampleStat.isFile, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("CLI - list command shows factories", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    // First init a project
    await runCLI(["init", tempDir]);
    
    // Change to that directory and list factories
    const originalCwd = Deno.cwd();
    Deno.chdir(tempDir);
    
    try {
      const result = await runCLI(["list"]);
      
      assertEquals(result.code, 0);
      assertEquals(result.stdout.includes("Available factories"), true);
      assertEquals(result.stdout.includes("example_component"), true);
    } finally {
      Deno.chdir(originalCwd);
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("CLI - validate command checks factories", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    // First init a project
    await runCLI(["init", tempDir]);
    
    // Change to that directory and validate
    const originalCwd = Deno.cwd();
    Deno.chdir(tempDir);
    
    try {
      const result = await runCLI(["validate"]);
      
      assertEquals(result.code, 0);
      assertEquals(result.stdout.includes("Validating"), true);
      assertEquals(result.stdout.includes("✓ All factories are valid!"), true);
    } finally {
      Deno.chdir(originalCwd);
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("CLI - create command generates file from factory", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    // First init a project
    await runCLI(["init", tempDir]);
    
    // Change to that directory
    const originalCwd = Deno.cwd();
    Deno.chdir(tempDir);
    
    try {
      const outputPath = "src/TestComponent.ts";
      const result = await runCLI([
        "create",
        "example_component",
        "--params",
        '{"componentName":"TestComponent","hasProps":true}',
        "--output",
        outputPath,
      ]);
      
      assertEquals(result.code, 0);
      assertEquals(result.stdout.includes(`✓ Created ${outputPath}`), true);
      
      // Verify file was created
      const stat = await Deno.stat(outputPath);
      assertEquals(stat.isFile, true);
      
      // Verify file content
      const content = await Deno.readTextFile(outputPath);
      assertEquals(content.includes("TestComponent"), true);
      assertEquals(content.includes("@codefactory"), true);
    } finally {
      Deno.chdir(originalCwd);
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
