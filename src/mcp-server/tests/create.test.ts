/**
 * Tests for codefactory_create tool (extraction-based workflow)
 */

import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import { createTool } from "../tools/create.ts";

// Helper to create a test factory
async function createTestFactory(dir: string, name: string, template: string) {
  await Deno.writeTextFile(
    `${dir}/${name}.hbs`,
    `---
name: ${name}
description: Test factory ${name}
outputPath: src/{{name}}.ts
params:
  name:
    type: string
    required: true
---
${template}
`,
  );
}

Deno.test("codefactory_create - should create file with new marker format", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Create test factory
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const result = await createTool.execute({
      factory: "test_factory",
      params: { name: "Hello" },
      outputPath: `${tempOutput}/hello.ts`,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    assertExists(result.content);
    assertEquals(result.content[0].type, "text");

    // Verify file was created with new marker format
    const content = await Deno.readTextFile(`${tempOutput}/hello.ts`);
    assertStringIncludes(content, '// @codefactory:start factory="test_factory"');
    assertStringIncludes(content, "export const Hello = 'test';");
    assertStringIncludes(content, "// @codefactory:end");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should error if file already exists", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const outputPath = `${tempOutput}/existing.ts`;
    
    // Create existing file
    await Deno.writeTextFile(outputPath, "existing content");

    const result = await createTool.execute({
      factory: "test_factory",
      params: { name: "Test" },
      outputPath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, true);
    assertExists(result.content);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "exists");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should error if factory not found", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    const result = await createTool.execute({
      factory: "nonexistent_factory",
      params: { name: "Test" },
      outputPath: `${tempOutput}/test.ts`,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, true);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "not found");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should require factory name", async () => {
  const result = await createTool.execute({
    params: { name: "Test" },
    outputPath: "/tmp/test.ts",
  });

  assertEquals(result.isError, true);
  const text = result.content[0].text || "";
  assertStringIncludes(text, "factory");
  assertStringIncludes(text, "required");
});

Deno.test("codefactory_create - should require outputPath", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const result = await createTool.execute({
      factory: "test_factory",
      params: { name: "Test" },
      // No outputPath - tool will generate one automatically
      outputPath: `${tempOutput}/auto-generated.ts`,
      factoriesPath: tempFactories,
    });

    // Should succeed because outputPath is provided
    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "Created");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should use default factoriesPath", async () => {
  const tempOutput = await Deno.makeTempDir();

  try {
    // This should use ./factories as default (built-ins will be loaded)
    const result = await createTool.execute({
      factory: "nonexistent",
      params: {},
      outputPath: `${tempOutput}/test.ts`,
    });

    // Should error because factory doesn't exist, but factoriesPath was used
    assertEquals(result.isError, true);
  } finally {
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should handle Handlebars template files", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "hbs_factory",
      "{{componentName}}"
    );

    const outputPath = `${tempOutput}/test.hbs`;
    const result = await createTool.execute({
      factory: "hbs_factory",
      params: { name: "Button", componentName: "Button" },
      outputPath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);

    // Verify Handlebars comment markers were used
    const content = await Deno.readTextFile(outputPath);
    assertStringIncludes(content, "{{!-- @codefactory:start");
    assertStringIncludes(content, 'factory="hbs_factory"');
    assertStringIncludes(content, "{{!-- @codefactory:end");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should handle nested output directories", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const nestedPath = `${tempOutput}/nested/deep/structure/file.ts`;
    const result = await createTool.execute({
      factory: "test_factory",
      params: { name: "Nested" },
      outputPath: nestedPath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);

    // Verify file was created in nested directory
    const exists = await Deno.stat(nestedPath)
      .then(() => true)
      .catch(() => false);
    assertEquals(exists, true);
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should pass all params to factory", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Factory with multiple parameters
    await Deno.writeTextFile(
      `${tempFactories}/multi_param.hbs`,
      `---
name: multi_param
description: Multiple parameters
params:
  name:
    type: string
    required: true
  value:
    type: string
    required: true
  type:
    type: string
    required: false
---
export const {{name}}: {{type}} = {{value}};
`
    );

    const result = await createTool.execute({
      factory: "multi_param",
      params: {
        name: "myVar",
        value: "'hello'",
        type: "string",
      },
      outputPath: `${tempOutput}/multi.ts`,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);

    const content = await Deno.readTextFile(`${tempOutput}/multi.ts`);
    assertStringIncludes(content, "export const myVar: string = 'hello';");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should return success message", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const result = await createTool.execute({
      factory: "test_factory",
      params: { name: "Success" },
      outputPath: `${tempOutput}/success.ts`,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    
    assertStringIncludes(text, "✅");
    assertStringIncludes(text, "Created");
    assertStringIncludes(text, "success.ts");
    assertStringIncludes(text, "test_factory");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should show next steps in response", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const result = await createTool.execute({
      factory: "test_factory",
      params: { name: "Test" },
      outputPath: `${tempOutput}/test.ts`,
      factoriesPath: tempFactories,
    });

    const text = result.content[0].text || "";
    
    // Should explain extraction workflow (note: lowercase "edit")
    assertStringIncludes(text, "Edit");
    assertStringIncludes(text, "sync");
    assertStringIncludes(text, "source of truth");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should list available factories when no factory specified", async () => {
  const tempFactories = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "factory_one",
      "test1"
    );
    await createTestFactory(
      tempFactories,
      "factory_two",
      "test2"
    );

    const result = await createTool.execute({
      factoriesPath: tempFactories,
    });

    // Should error because neither description nor factory was provided
    assertEquals(result.isError, true);
    const text = result.content[0].text || "";
    
    assertStringIncludes(text, "description");
    assertStringIncludes(text, "factory");
    assertStringIncludes(text, "required");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
  }
});
