/**
 * Tests for codefactory_sync tool (extraction-based workflow)
 */

import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import { syncTool } from "../tools/sync.ts";

// Helper to create a test factory
async function createTestFactory(dir: string, name: string, template: string) {
  await Deno.writeTextFile(
    `${dir}/${name}.hbs`,
    `---
name: ${name}
description: Test factory ${name}
params:
  name:
    type: string
    required: true
---
${template}
`,
  );
}

Deno.test("codefactory_sync - should sync single file", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Create factory
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'value';"
    );

    // Create file with marker
    const filePath = `${tempOutput}/test.ts`;
    await Deno.writeTextFile(
      filePath,
      '// @codefactory:start factory="test_factory"\n' +
      "export const Original = 'value';\n" +
      "// @codefactory:end\n"
    );

    // User edits the code
    await Deno.writeTextFile(
      filePath,
      '// @codefactory:start factory="test_factory"\n' +
      "export const EditedByUser = 'value';\n" +
      "// @codefactory:end\n"
    );

    const result = await syncTool.execute({
      path: filePath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    assertExists(result.content);

    // Verify file was synced (regenerated with extracted params)
    const content = await Deno.readTextFile(filePath);
    assertStringIncludes(content, "EditedByUser");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should sync all files in directory", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    // Create multiple files with markers
    const file1 = `${tempOutput}/file1.ts`;
    const file2 = `${tempOutput}/file2.ts`;
    
    await Deno.writeTextFile(
      file1,
      '// @codefactory:start factory="test_factory"\n' +
      "export const One = 'test';\n" +
      "// @codefactory:end\n"
    );
    
    await Deno.writeTextFile(
      file2,
      '// @codefactory:start factory="test_factory"\n' +
      "export const Two = 'test';\n" +
      "// @codefactory:end\n"
    );

    const result = await syncTool.execute({
      path: tempOutput,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    
    assertStringIncludes(text, "Synced");
    assertStringIncludes(text, "2"); // 2 files synced
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should preserve custom code outside markers", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'value';"
    );

    const filePath = `${tempOutput}/test.ts`;
    await Deno.writeTextFile(
      filePath,
      "// Header comment\n\n" +
      '// @codefactory:start factory="test_factory"\n' +
      "export const Test = 'value';\n" +
      "// @codefactory:end\n\n" +
      "// Custom code below\n" +
      "export const custom = 'preserved';\n"
    );

    const result = await syncTool.execute({
      path: filePath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);

    // Verify custom code was preserved
    const content = await Deno.readTextFile(filePath);
    assertStringIncludes(content, "// Header comment");
    assertStringIncludes(content, "// Custom code below");
    assertStringIncludes(content, "export const custom = 'preserved';");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should error if no marker found", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    const filePath = `${tempOutput}/no-marker.ts`;
    await Deno.writeTextFile(filePath, "export const x = 'no marker';");

    const result = await syncTool.execute({
      path: filePath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, true);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "marker");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should error if factory not found", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    const filePath = `${tempOutput}/bad-factory.ts`;
    await Deno.writeTextFile(
      filePath,
      '// @codefactory:start factory="unknown_factory"\n' +
      "export const x = 'test';\n" +
      "// @codefactory:end\n"
    );

    const result = await syncTool.execute({
      path: filePath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, true);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "not found");
    assertStringIncludes(text, "unknown_factory");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should error if factory has no template", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Create factory WITHOUT template field
    await Deno.writeTextFile(
      `${tempFactories}/no_template.ts`,
      `export default {
  name: "no_template",
  description: "No template",
  params: {},
  generate: () => ({ content: "test" }),
};`
    );

    const filePath = `${tempOutput}/test.ts`;
    await Deno.writeTextFile(
      filePath,
      '// @codefactory:start factory="no_template"\n' +
      "export const x = 'test';\n" +
      "// @codefactory:end\n"
    );

    const result = await syncTool.execute({
      path: filePath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, true);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "template");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should scan subdirectories recursively", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    // Create nested directory structure
    const subDir = `${tempOutput}/components`;
    await Deno.mkdir(subDir, { recursive: true });

    await Deno.writeTextFile(
      `${tempOutput}/root.ts`,
      '// @codefactory:start factory="test_factory"\n' +
      "export const Root = 'test';\n" +
      "// @codefactory:end\n"
    );

    await Deno.writeTextFile(
      `${subDir}/nested.ts`,
      '// @codefactory:start factory="test_factory"\n' +
      "export const Nested = 'test';\n" +
      "// @codefactory:end\n"
    );

    const result = await syncTool.execute({
      path: tempOutput,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    
    assertStringIncludes(text, "2"); // 2 files synced
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should continue on errors and report all", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    // Good file
    await Deno.writeTextFile(
      `${tempOutput}/good.ts`,
      '// @codefactory:start factory="test_factory"\n' +
      "export const Good = 'test';\n" +
      "// @codefactory:end\n"
    );

    // Bad file (unknown factory)
    await Deno.writeTextFile(
      `${tempOutput}/bad.ts`,
      '// @codefactory:start factory="unknown"\n' +
      "export const Bad = 'test';\n" +
      "// @codefactory:end\n"
    );

    const result = await syncTool.execute({
      path: tempOutput,
      factoriesPath: tempFactories,
    });

    // Should be an error since one file failed
    assertEquals(result.isError, true);
    const text = result.content[0].text || "";
    
    assertStringIncludes(text, "1"); // 1 file synced
    assertStringIncludes(text, "error"); // 1 error reported
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should handle empty directory", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    const result = await syncTool.execute({
      path: tempOutput,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    
    assertStringIncludes(text, "0"); // 0 files synced
    assertStringIncludes(text, "file(s)"); // mentions files
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should skip files without markers", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    // File with marker
    await Deno.writeTextFile(
      `${tempOutput}/with-marker.ts`,
      '// @codefactory:start factory="test_factory"\n' +
      "export const WithMarker = 'test';\n" +
      "// @codefactory:end\n"
    );

    // File without marker (should be skipped)
    await Deno.writeTextFile(
      `${tempOutput}/no-marker.ts`,
      "export const NoMarker = 'test';"
    );

    const result = await syncTool.execute({
      path: tempOutput,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    
    assertStringIncludes(text, "1"); // Only 1 file synced
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should use current directory if path not specified", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Change to temp directory
    const originalCwd = Deno.cwd();
    Deno.chdir(tempOutput);

    const result = await syncTool.execute({
      factoriesPath: tempFactories,
    });

    // Should succeed with 0 files (empty directory)
    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "0"); // 0 files synced
    
    // Restore cwd
    Deno.chdir(originalCwd);
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should use default factoriesPath", async () => {
  const tempOutput = await Deno.makeTempDir();

  try {
    await Deno.writeTextFile(
      `${tempOutput}/test.ts`,
      '// @codefactory:start factory="test"\n' +
      "content\n" +
      "// @codefactory:end\n"
    );

    const result = await syncTool.execute({
      path: tempOutput,
    });

    // Should error because factory doesn't exist, but factoriesPath was used
    assertEquals(result.isError, true);
  } finally {
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should report extracted changes", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = '{{value}}';"
    );

    const filePath = `${tempOutput}/test.ts`;
    await Deno.writeTextFile(
      filePath,
      '// @codefactory:start factory="test_factory"\n' +
      "export const MyVar = 'changed';\n" +
      "// @codefactory:end\n"
    );

    const result = await syncTool.execute({
      path: filePath,
      factoriesPath: tempFactories,
    });

    const text = result.content[0].text || "";
    
    assertStringIncludes(text, "Parameters extracted");
    assertStringIncludes(text, "test.ts");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should warn about legacy markers", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    const filePath = `${tempOutput}/legacy.ts`;
    await Deno.writeTextFile(
      filePath,
      '// @codefactory:start id="uuid-123"\n' +
      "export const x = 'test';\n" +
      "// @codefactory:end\n"
    );

    const result = await syncTool.execute({
      path: filePath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, true);
    const text = result.content[0].text || "";
    
    assertStringIncludes(text, "Old marker format");
    assertStringIncludes(text, "id=");
    assertStringIncludes(text, "factory=");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should show success message with file count", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    await Deno.writeTextFile(
      `${tempOutput}/test.ts`,
      '// @codefactory:start factory="test_factory"\n' +
      "export const Test = 'test';\n" +
      "// @codefactory:end\n"
    );

    const result = await syncTool.execute({
      path: tempOutput,
      factoriesPath: tempFactories,
    });

    const text = result.content[0].text || "";
    
    assertStringIncludes(text, "✅");
    assertStringIncludes(text, "Synced");
    assertStringIncludes(text, "1");
    assertStringIncludes(text, "file");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});
