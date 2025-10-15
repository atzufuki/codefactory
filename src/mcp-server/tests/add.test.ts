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

Deno.test("codefactory_add - should require description or factory", async () => {
  const result = await addTool.execute({});

  assertEquals(result.isError, true);
  assertEquals(
    result.content[0].text?.includes("Either 'description' or 'factory'"),
    true,
  );
});

Deno.test("codefactory_add - should infer factory from description", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    // Test that inference works when factory name is explicitly mentioned
    const result = await addTool.execute({
      description: "use the 'factory' to create a new template",
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
    });

    // Should succeed because description mentions 'factory' explicitly
    assertEquals(result.isError, undefined);
    
    // Verify factory was inferred
    const updated = await ManifestManager.load(tempManifest);
    const calls = updated.getAllFactoryCalls();
    assertEquals(calls[0].factory, "factory");
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should handle empty factory list gracefully", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    // Built-ins will still be loaded, so there will always be factories
    // This test now checks that it works even with just built-ins
    const result = await addTool.execute({
      description: "create something with factory",
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
    });

    // Should use built-in "factory"
    assertEquals(result.isError, undefined);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should use custom outputPath", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    await createTestFactory(tempFactories, "test_factory");

    const result = await addTool.execute({
      factory: "test_factory",
      params: { name: "Custom" },
      outputPath: "custom/path/file.ts",
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);

    const updated = await ManifestManager.load(tempManifest);
    const calls = updated.getAllFactoryCalls();
    assertEquals(calls[0].outputPath, "custom/path/file.ts");
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should handle dependsOn", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    manager.addFactoryCall({
      id: "base-factory",
      factory: "test_factory",
      params: {},
      outputPath: "src/base.ts",
    });
    await manager.save();

    await createTestFactory(tempFactories, "test_factory");

    const result = await addTool.execute({
      factory: "test_factory",
      params: { name: "Dependent" },
      dependsOn: ["base-factory"],
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);

    const updated = await ManifestManager.load(tempManifest);
    const calls = updated.getAllFactoryCalls();
    assertEquals(calls.length, 2);
    assertEquals(calls[1].dependsOn, ["base-factory"]);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should infer 'factory' from description", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    const result = await addTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      description: "a factory for React hooks",
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertEquals(text.includes("Factory: factory"), true);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should extract component name and props", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    await Deno.writeTextFile(
      `${tempFactories}/react_component.hbs`,
      `---
name: react_component
description: React component
---
test
`,
    );

    const result = await addTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      description: "a Button component with label and onClick props",
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertEquals(text.includes("componentName"), true);
    assertEquals(text.includes("Button"), true);
    assertEquals(text.includes("props"), true);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should infer 'typescript_function' factory", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    await Deno.writeTextFile(
      `${tempFactories}/typescript_function.hbs`,
      `---
name: typescript_function
description: TypeScript function
---
test
`,
    );

    const result = await addTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      description: "a function to calculate total",
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertEquals(text.includes("Factory: typescript_function"), true);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should extract factory name from quotes", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    await Deno.writeTextFile(
      `${tempFactories}/custom_factory.hbs`,
      `---
name: custom_factory
description: Custom factory
---
test
`,
    );

    const result = await addTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      description: "use 'custom_factory' to create something",
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertEquals(text.includes("Factory: custom_factory"), true);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should handle meta-factory params", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    const result = await addTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      description: "a factory for custom validators with validation logic",
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertEquals(text.includes("name"), true);
    assertEquals(text.includes("description"), true);
    assertEquals(text.includes("template"), true);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should map meta-factory params correctly", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    // Test with correct parameter names
    const result = await addTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      factory: "factory",
      params: {
        name: "react_component",
        description: "Creates React components",
        template: "export const {{name}} = () => <div>{{name}}</div>;",
        outputPath: "factories/react_component.hbs",
      },
    });

    assertEquals(result.isError, undefined);
    
    // Verify the params were stored correctly
    const updated = await ManifestManager.load(tempManifest);
    const call = updated.getAllFactoryCalls()[0];
    assertEquals(call.params.name, "react_component");
    assertEquals(call.params.description, "Creates React components");
    assertEquals(call.params.template, "export const {{name}} = () => <div>{{name}}</div>;");
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should map legacy meta-factory param names", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    // Test with legacy parameter names (factoryName, factoryDescription)
    const result = await addTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      factory: "factory",
      params: {
        factoryName: "ts_function",
        factoryDescription: "Creates TypeScript functions",
        template: "export function {{name}}() {}",
      },
    });

    assertEquals(result.isError, undefined);
    
    // Verify the params were mapped correctly
    const updated = await ManifestManager.load(tempManifest);
    const call = updated.getAllFactoryCalls()[0];
    assertEquals(call.params.name, "ts_function");
    assertEquals(call.params.description, "Creates TypeScript functions");
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should reject meta-factory without template", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    // Try without template (should fail)
    const result = await addTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      factory: "factory",
      params: {
        name: "incomplete_factory",
        description: "Missing template",
        // template: missing!
      },
    });

    assertEquals(result.isError, true);
    const text = result.content[0].text || "";
    assertEquals(text.includes("requires 'template'"), true);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});

Deno.test("codefactory_add - should extract params when args.params is empty object", async () => {
  const tempManifest = await Deno.makeTempFile({ suffix: ".json" });
  const tempFactories = await Deno.makeTempDir();

  try {
    const manager = new ManifestManager(tempManifest);
    await manager.save();

    // Create factory factory
    await Deno.writeTextFile(
      `${tempFactories}/factory.hbs`,
      `---
name: factory
description: Meta-factory
params:
  name:
    type: string
    required: true
  description:
    type: string
    required: true
  template:
    type: string
    required: true
---
test
`,
    );

    // Simulate Copilot behavior: empty params object
    const result = await addTool.execute({
      manifestPath: tempManifest,
      factoriesPath: tempFactories,
      description: "Create a factory for React components with props and state",
      factory: "factory",
      params: {}, // ← Empty object! Should fall back to extractParams
    });

    assertEquals(result.isError, undefined);
    
    // Verify params were extracted from description
    const manifest = await ManifestManager.load(tempManifest);
    const calls = manifest.getAllFactoryCalls();
    assertEquals(calls.length, 1);
    
    const call = calls[0];
    assertEquals(call.factory, "factory");
    
    // Should have extracted name, description, and template
    assertEquals(typeof call.params.name, "string");
    assertEquals(typeof call.params.description, "string");
    assertEquals(typeof call.params.template, "string");
    assertEquals((call.params.name as string).length > 0, true);
  } finally {
    await Deno.remove(tempManifest);
    await Deno.remove(tempFactories, { recursive: true });
  }
});
