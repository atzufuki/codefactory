/**
 * Tests for codefactory_add tool
 */

import { assertEquals, assertExists } from "@std/assert";
import { addTool } from "../tools/add.ts";
import { ManifestManager } from "@codefactory/core";

// Helper to create a test factory
async function createTestFactory(dir: string, name: string) {
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
export const {{name}} = "test";
`,
  );
}

Deno.test("codefactory_add - should add factory call with AI inference", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    // Create empty manifest
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    // Create test factory
    await createTestFactory(tempFactories, "test_factory");

    const result = await addTool.execute({
      factory: "test_factory",
      params: { name: "Hello" },
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    assertExists(result.content);
    assertEquals(result.content[0].type, "text");

    // Verify manifest was updated
    const updated = await ManifestManager.load(tempManifest);
    const calls = updated.getAllFactoryCalls();
    assertEquals(calls.length, 1);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should reject duplicate IDs", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    // Create manifest with existing call
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "existing-id",
      factory: "test_factory",
      params: { name: "Test" },
      outputPath: "src/test.ts",
    });
    await manager.save();

    // Create test factory
    await createTestFactory(tempFactories, "test_factory");

    const result = await addTool.execute({
      id: "existing-id",
      factory: "test_factory",
      params: { name: "Another" },
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, true);
    assertExists(result.content);
    assertEquals(result.content[0].type, "text");
    assertEquals(
      result.content[0].text?.includes("already exists"),
      true,
    );
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should validate factory exists", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    const result = await addTool.execute({
      factory: "nonexistent_factory",
      params: { name: "Test" },
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, true);
    assertExists(result.content);
    assertEquals(
      result.content[0].text?.includes("not found"),
      true,
    );
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});
