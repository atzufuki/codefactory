/**
 * Tests for codefactory_inspect tool
 */

import { assertEquals, assertExists } from "@std/assert";
import { inspectTool } from "../tools/inspect.ts";
import { ManifestManager } from "@codefactory/core";

Deno.test("codefactory_inspect - should show manifest contents", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "test-1",
      factory: "simple_function",
      params: { name: "test1" },
      outputPath: "src/test1.ts",
    });
    manager.addFactoryCall({
      id: "test-2",
      factory: "simple_function",
      params: { name: "test2" },
      outputPath: "src/test2.ts",
      dependsOn: ["test-1"],
    });
    await manager.save();

    const result = await inspectTool.execute({
      manifestPath: tempManifest,
    });

    assertEquals(result.isError, undefined);
    assertExists(result.content);
    
    const text = result.content[0].text || "";
    assertEquals(text.includes("test-1"), true);
    assertEquals(text.includes("test-2"), true);
    assertEquals(text.includes("simple_function"), true);
  } finally {
    await Deno.remove(tempManifest);
  }
});

Deno.test("codefactory_inspect - should show execution order", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "base",
      factory: "component",
      params: {},
      outputPath: "src/base.ts",
    });
    manager.addFactoryCall({
      id: "derived",
      factory: "component",
      params: {},
      outputPath: "src/derived.ts",
      dependsOn: ["base"],
    });
    await manager.save();

    const result = await inspectTool.execute({
      manifestPath: tempManifest,
    });

    const text = result.content[0].text || "";
    assertEquals(text.includes("Execution order"), true);
    assertEquals(text.includes("base"), true);
    assertEquals(text.includes("derived"), true);
  } finally {
    await Deno.remove(tempManifest);
  }
});

Deno.test("codefactory_inspect - should handle empty manifest", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    const result = await inspectTool.execute({
      manifestPath: tempManifest,
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertEquals(text.includes("0 factory calls"), true);
  } finally {
    await Deno.remove(tempManifest);
  }
});
