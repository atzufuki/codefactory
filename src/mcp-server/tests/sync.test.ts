/**
 * Tests for codefactory_sync tool (metadata-based workflow)
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
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'value';"
    );

    const filePath = `${tempOutput}/test.ts`;
    await Deno.writeTextFile(
      filePath,
      '/**\n' +
      ' * @codefactory test_factory\n' +
      ' * name: EditedByUser\n' +
      ' */\n\n' +
      "export const EditedByUser = 'value';\n"
    );

    const result = await syncTool.execute({
      path: filePath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    assertExists(result.content);

    const content = await Deno.readTextFile(filePath);
    assertStringIncludes(content, "EditedByUser");
    assertStringIncludes(content, "@codefactory test_factory");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should sync directory", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const file1 = `${tempOutput}/file1.ts`;
    const file2 = `${tempOutput}/file2.ts`;
    
    await Deno.writeTextFile(
      file1,
      '/**\n * @codefactory test_factory\n * name: One\n */\n\n' +
      "export const One = 'test';\n"
    );
    
    await Deno.writeTextFile(
      file2,
      '/**\n * @codefactory test_factory\n * name: Two\n */\n\n' +
      "export const Two = 'test';\n"
    );

    const result = await syncTool.execute({
      path: tempOutput,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);

    const content1 = await Deno.readTextFile(file1);
    const content2 = await Deno.readTextFile(file2);
    assertStringIncludes(content1, "One");
    assertStringIncludes(content2, "Two");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should error if no metadata", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    const filePath = `${tempOutput}/test.ts`;
    await Deno.writeTextFile(filePath, "export const Test = 'no metadata';");

    const result = await syncTool.execute({
      path: filePath,
      factoriesPath: tempFactories,
    });

    assertExists(result.isError);
    assertStringIncludes(
      result.content[0].text || "",
      "No @codefactory metadata"
    );
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should error if factory not found", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    const filePath = `${tempOutput}/test.ts`;
    await Deno.writeTextFile(
      filePath,
      '/**\n * @codefactory nonexistent\n * name: Test\n */\n\n' +
      "export const Test = 'test';"
    );

    const result = await syncTool.execute({
      path: filePath,
      factoriesPath: tempFactories,
    });

    assertExists(result.isError);
    assertStringIncludes(
      result.content[0].text || "",
      "not found"
    );
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
    assertStringIncludes(
      result.content[0].text || "",
      "0 file"
    );
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should use current directory if no path", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();
  const originalCwd = Deno.cwd();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const filePath = `${tempOutput}/test.ts`;
    await Deno.writeTextFile(
      filePath,
      '/**\n * @codefactory test_factory\n * name: Test\n */\n\n' +
      "export const Test = 'test';"
    );

    Deno.chdir(tempOutput);

    const result = await syncTool.execute({
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should use default factoriesPath", async () => {
  const tempOutput = await Deno.makeTempDir();

  try {
    const filePath = `${tempOutput}/test.ts`;
    await Deno.writeTextFile(
      filePath,
      '/**\n * @codefactory test_factory\n * name: Test\n */\n\n' +
      "export const Test = 'test';"
    );

    const result = await syncTool.execute({
      path: filePath,
    });

    // Should error because factory doesn't exist in default path
    assertExists(result.isError);
  } finally {
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should handle absolute path to single file", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'synced';"
    );

    const filePath = `${tempOutput}/single.ts`;
    await Deno.writeTextFile(
      filePath,
      '/**\n * @codefactory test_factory\n * name: SingleFile\n */\n\n' +
      "export const SingleFile = 'synced';"
    );

    const result = await syncTool.execute({
      path: filePath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "✅");
    assertStringIncludes(text, "single.ts");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_sync - should handle relative path to single file", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();
  const originalCwd = Deno.cwd();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'relative';"
    );

    Deno.chdir(tempOutput);

    const filePath = "relative.ts";
    await Deno.writeTextFile(
      filePath,
      '/**\n * @codefactory test_factory\n * name: RelativeFile\n */\n\n' +
      "export const RelativeFile = 'relative';"
    );

    const result = await syncTool.execute({
      path: filePath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "✅");
    assertStringIncludes(text, "relative.ts");
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

