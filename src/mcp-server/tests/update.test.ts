/**
 * Tests for codefactory_update tool
 */

import { assertEquals, assertExists } from "@std/assert";
import { updateTool } from "../tools/update.ts";
import { ManifestManager } from "@codefactory/core";

Deno.test("codefactory_update - should update factory call params", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "test-component",
      factory: "component",
      params: { name: "Test", props: ["label"] },
      outputPath: "src/Test.tsx",
    });
    await manager.save();

    const result = await updateTool.execute({
      id: "test-component",
      updates: {
        params: { name: "Test", props: ["label", "onClick"] },
      },
      manifestPath: tempManifest,
    });

    assertEquals(result.isError, undefined);
    assertExists(result.content);
    
    const text = result.content[0].text || "";
    assertEquals(text.includes("Updated"), true);

    // Verify update was applied
    const updated = await ManifestManager.load(tempManifest);
    const call = updated.getFactoryCall("test-component");
    assertEquals(call?.params.props, ["label", "onClick"]);
  } finally {
    await Deno.remove(tempManifest);
  }
});

Deno.test("codefactory_update - should reject update for non-existent ID", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    const result = await updateTool.execute({
      id: "non-existent",
      updates: { params: { name: "Test" } },
      manifestPath: tempManifest,
    });

    assertEquals(result.isError, true);
    assertExists(result.content);
    assertEquals(result.content[0].text?.includes("not found"), true);
  } finally {
    await Deno.remove(tempManifest);
  }
});

Deno.test("codefactory_update - should update output path", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "test-component",
      factory: "component",
      params: { name: "Test" },
      outputPath: "src/Test.tsx",
    });
    await manager.save();

    const result = await updateTool.execute({
      id: "test-component",
      updates: {
        outputPath: "src/components/Test.tsx",
      },
      manifestPath: tempManifest,
    });

    assertEquals(result.isError, undefined);

    // Verify output path was updated
    const updated = await ManifestManager.load(tempManifest);
    const call = updated.getFactoryCall("test-component");
    assertEquals(call?.outputPath, "src/components/Test.tsx");
  } finally {
    await Deno.remove(tempManifest);
  }
});
