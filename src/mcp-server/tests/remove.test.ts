/**
 * Tests for codefactory_remove tool
 */

import { assertEquals, assertExists } from "@std/assert";
import { removeTool } from "../tools/remove.ts";
import { ManifestManager } from "@codefactory/core";

Deno.test("codefactory_remove - should remove factory call", async () => {
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

    const result = await removeTool.execute({
      id: "test-component",
      manifestPath: tempManifest,
    });

    assertEquals(result.isError, undefined);
    assertExists(result.content);
    
    const text = result.content[0].text || "";
    assertEquals(text.includes("Removed"), true);

    // Verify it was removed
    const updated = await ManifestManager.load(tempManifest);
    const calls = updated.getAllFactoryCalls();
    assertEquals(calls.length, 0);
  } finally {
    await Deno.remove(tempManifest);
  }
});

Deno.test("codefactory_remove - should reject removal of non-existent ID", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    const result = await removeTool.execute({
      id: "non-existent",
      manifestPath: tempManifest,
    });

    assertEquals(result.isError, true);
    assertExists(result.content);
    assertEquals(result.content[0].text?.includes("not found"), true);
  } finally {
    await Deno.remove(tempManifest);
  }
});

Deno.test("codefactory_remove - should warn about dependencies", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "base",
      factory: "component",
      params: { name: "Base" },
      outputPath: "src/Base.tsx",
    });
    manager.addFactoryCall({
      id: "derived",
      factory: "component",
      params: { name: "Derived" },
      outputPath: "src/Derived.tsx",
      dependsOn: ["base"],
    });
    await manager.save();

    const result = await removeTool.execute({
      id: "base",
      force: true, // Force removal despite dependency
      manifestPath: tempManifest,
    });

    // Should succeed but with warning
    assertEquals(result.isError, undefined);
    
    const text = result.content[0].text || "";
    assertEquals(text.includes("derived"), true);
    assertEquals(text.includes("depended on this"), true);
  } finally {
    await Deno.remove(tempManifest);
  }
});
