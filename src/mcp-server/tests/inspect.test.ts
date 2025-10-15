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
    assertEquals(text.includes("Build Order"), true);
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
    assertEquals(text.includes("Total factory calls: 0"), true);
  } finally {
    await Deno.remove(tempManifest);
  }
});

Deno.test("codefactory_inspect - should show detailed view of specific ID", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    // Add base first
    manager.addFactoryCall({
      id: "base-component",
      factory: "react_component",
      params: {},
      outputPath: "src/components/Base.tsx",
    });
    // Then add the one we'll inspect
    manager.addFactoryCall({
      id: "test-component",
      factory: "react_component",
      params: { componentName: "Test", props: ["value: string"] },
      outputPath: "src/components/Test.tsx",
      dependsOn: ["base-component"],
    });
    await manager.save();

    const result = await inspectTool.execute({
      manifestPath: tempManifest,
      id: "test-component",
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertEquals(text.includes("test-component"), true);
    assertEquals(text.includes("react_component"), true);
    assertEquals(text.includes("Parameters:"), true);
    assertEquals(text.includes("componentName"), true);
    assertEquals(text.includes("Dependencies:"), true);
    assertEquals(text.includes("base-component"), true);
    assertEquals(text.includes("File not generated yet"), true);
  } finally {
    await Deno.remove(tempManifest);
  }
});

Deno.test("codefactory_inspect - should handle non-existent ID", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    const result = await inspectTool.execute({
      manifestPath: tempManifest,
      id: "non-existent",
    });

    assertEquals(result.isError, true);
    const text = result.content[0].text || "";
    assertEquals(text.includes("not found"), true);
  } finally {
    await Deno.remove(tempManifest);
  }
});

Deno.test("codefactory_inspect - should show file exists status", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFile = await Deno.makeTempFile({ suffix: ".ts" });

  try {
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "existing-file",
      factory: "test_factory",
      params: {},
      outputPath: tempFile,
    });
    await manager.save();

    const result = await inspectTool.execute({
      manifestPath: tempManifest,
      id: "existing-file",
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertEquals(text.includes("File exists"), true);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFile);
  }
});

Deno.test("codefactory_inspect - should hide graph when showGraph=false", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "test-1",
      factory: "test",
      params: {},
      outputPath: "src/test.ts",
    });
    await manager.save();

    const result = await inspectTool.execute({
      manifestPath: tempManifest,
      showGraph: false,
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertEquals(text.includes("Dependency Graph"), false);
  } finally {
    await Deno.remove(tempManifest);
  }
});

Deno.test("codefactory_inspect - should hide stats when showStats=false", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "test-1",
      factory: "test",
      params: {},
      outputPath: "src/test.ts",
    });
    await manager.save();

    const result = await inspectTool.execute({
      manifestPath: tempManifest,
      showStats: false,
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertEquals(text.includes("Build Order"), false);
  } finally {
    await Deno.remove(tempManifest);
  }
});

Deno.test("codefactory_inspect - should show factory call without dependencies", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });

  try {
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "standalone",
      factory: "simple",
      params: { value: 42 },
      outputPath: "src/standalone.ts",
    });
    await manager.save();

    const result = await inspectTool.execute({
      manifestPath: tempManifest,
      id: "standalone",
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertEquals(text.includes("standalone"), true);
    // Should not show Dependencies section
    assertEquals(text.includes("Dependencies:"), false);
  } finally {
    await Deno.remove(tempManifest);
  }
});
