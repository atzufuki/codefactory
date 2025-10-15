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
outputPath: "{{outputDir}}/{{functionName}}.ts"
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
description: Simple function generator
outputPath: "{{outputDir}}/{{functionName}}.ts"
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
description: Simple function generator
outputPath: "{{outputDir}}/{{functionName}}.ts"
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
      ids: ["test-1"], // Only build test-1
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

Deno.test("codefactory_produce - should handle build errors", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "nonexistent-factory",
      factory: "does_not_exist",
      params: {},
      outputPath: "/tmp/output.ts",
    });
    await manager.save();

    const result = await produceTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, true);
    const text = result.content[0].text || "";
    assertEquals(text.includes("failed"), true);
    assertEquals(text.includes("errors"), true);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_produce - dry run shows files to be created", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await Deno.writeTextFile(
      `${tempFactories}/simple.hbs`,
      `---
name: simple_test
description: Simple test
outputPath: "{{outputDir}}/test.ts"
---
test content
`,
    );

    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "test-file",
      factory: "simple_test",
      params: { outputDir: tempOutput },
      outputPath: `${tempOutput}/test.ts`,
    });
    await manager.save();

    const result = await produceTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      dryRun: true,
    });

    const text = result.content[0].text || "";
    assertEquals(text.includes("Dry run"), true);
    assertEquals(text.includes("Will generate"), true);
    assertEquals(text.includes("test.ts"), true);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_produce - dry run shows file errors", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Create factory
    await Deno.writeTextFile(
      `${tempFactories}/simple.hbs`,
      `---
name: simple_test
description: Simple test
outputPath: "{{outputDir}}/test.ts"
---
test content
`,
    );

    // Create existing file WITHOUT markers
    const existingFile = `${tempOutput}/existing.ts`;
    await Deno.writeTextFile(existingFile, "// No markers");

    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "test-existing",
      factory: "simple_test",
      params: { outputDir: tempOutput },
      outputPath: existingFile, // This file exists but has no markers
    });
    await manager.save();

    const result = await produceTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      dryRun: true,
    });

    assertEquals(result.isError, undefined); // Dry run doesn't error
    const text = result.content[0].text || "";
    assertEquals(text.includes("errors"), true);
    assertEquals(text.includes("⚠️"), true);
    assertEquals(text.includes("no marker"), true);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_produce - dry run distinguishes new vs update", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await Deno.writeTextFile(
      `${tempFactories}/simple.hbs`,
      `---
name: simple_test
description: Simple test
outputPath: "{{outputDir}}/{{filename}}.ts"
---
// @codefactory:start id="{{id}}"
test content
// @codefactory:end
`,
    );

    // Create existing file with markers
    await Deno.writeTextFile(
      `${tempOutput}/existing.ts`,
      `// @codefactory:start id="existing-file"
old content
// @codefactory:end
`,
    );

    const manager = new ManifestManager(tempManifest);
    // This will update existing file
    manager.addFactoryCall({
      id: "existing-file",
      factory: "simple_test",
      params: { outputDir: tempOutput, filename: "existing", id: "existing-file" },
      outputPath: `${tempOutput}/existing.ts`,
    });
    // This will create new file
    manager.addFactoryCall({
      id: "new-file",
      factory: "simple_test",
      params: { outputDir: tempOutput, filename: "newfile", id: "new-file" },
      outputPath: `${tempOutput}/newfile.ts`,
    });
    await manager.save();

    const result = await produceTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      dryRun: true,
    });

    const text = result.content[0].text || "";
    assertEquals(text.includes("Dry run"), true);
    assertEquals(text.includes("➕"), true); // New file icon
    assertEquals(text.includes("🔄"), true); // Update icon
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});
