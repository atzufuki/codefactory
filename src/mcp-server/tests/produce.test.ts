/**
 * Tests for codefactory_produce tool
 */

import { assertEquals, assertExists } from "@std/assert";
import { produceTool } from "../tools/produce.ts";
import { ManifestManager } from "@codefactory/core";

Deno.test("codefactory_produce - should build all factory calls", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Create test factory
    await Deno.writeTextFile(
      `${tempFactories}/simple.hbs`,
      `---
name: simple_function
description: Simple function
outputPath: {{outputDir}}/{{functionName}}.ts
---
export function {{functionName}}() {
  return "{{functionName}}";
}
`,
    );

    // Create manifest with factory call
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "test-function",
      factory: "simple_function",
      params: {
        functionName: "testFunc",
        outputDir: tempOutput,
      },
      outputPath: `${tempOutput}/testFunc.ts`,
    });
    await manager.save();

    const result = await produceTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      dryRun: false,
    });

    assertEquals(result.isError, undefined);
    assertExists(result.content);
    
    const text = result.content[0].text || "";
    assertEquals(text.includes("success"), true);

    // Verify file was created
    const fileExists = await Deno.stat(`${tempOutput}/testFunc.ts`)
      .then(() => true)
      .catch(() => false);
    assertEquals(fileExists, true);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_produce - should support dry-run mode", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await Deno.writeTextFile(
      `${tempFactories}/simple.hbs`,
      `---
name: simple_function
outputPath: {{outputDir}}/{{functionName}}.ts
---
export function {{functionName}}() {}
`,
    );

    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "test-function",
      factory: "simple_function",
      params: {
        functionName: "testFunc",
        outputDir: tempOutput,
      },
      outputPath: `${tempOutput}/testFunc.ts`,
    });
    await manager.save();

    const result = await produceTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      dryRun: true,
    });

    assertEquals(result.isError, undefined);
    
    const text = result.content[0].text || "";
    assertEquals(text.includes("Dry run"), true);

    // Verify file was NOT created
    const fileExists = await Deno.stat(`${tempOutput}/testFunc.ts`)
      .then(() => true)
      .catch(() => false);
    assertEquals(fileExists, false);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_produce - should build specific factory IDs", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await Deno.writeTextFile(
      `${tempFactories}/simple.hbs`,
      `---
name: simple_function
outputPath: {{outputDir}}/{{functionName}}.ts
---
export function {{functionName}}() {}
`,
    );

    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "test-1",
      factory: "simple_function",
      params: { functionName: "func1", outputDir: tempOutput },
      outputPath: `${tempOutput}/func1.ts`,
    });
    manager.addFactoryCall({
      id: "test-2",
      factory: "simple_function",
      params: { functionName: "func2", outputDir: tempOutput },
      outputPath: `${tempOutput}/func2.ts`,
    });
    await manager.save();

    const result = await produceTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      factoryIds: ["test-1"],
      dryRun: false,
    });

    assertEquals(result.isError, undefined);

    // Verify only func1 was created
    const func1Exists = await Deno.stat(`${tempOutput}/func1.ts`)
      .then(() => true)
      .catch(() => false);
    const func2Exists = await Deno.stat(`${tempOutput}/func2.ts`)
      .then(() => true)
      .catch(() => false);
    
    assertEquals(func1Exists, true);
    assertEquals(func2Exists, false);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});
