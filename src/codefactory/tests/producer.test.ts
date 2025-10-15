import { assertEquals, assertStringIncludes } from "@std/assert";
import { Producer } from "../producer.ts";
import { ManifestManager } from "../manifest.ts";
import { FactoryRegistry } from "../registry.ts";
import { TemplateLoader } from "../template-loader.ts";
import type { FactoryDefinition } from "../types.ts";
import { join } from "@std/path";

const testDir = join(
  new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
  "fixtures",
  "producer"
);

// Cleanup test directory before/after tests
async function cleanup() {
  try {
    await Deno.remove(testDir, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }
}

// Helper to create a simple test factory
function createTestFactory(name: string, output: string): FactoryDefinition {
  return TemplateLoader.toFactoryDefinition(
    {
      name,
      description: "Test factory",
      params: {},
    },
    output
  );
}

Deno.test("Producer - basic building", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should build single factory call", async () => {
    const manifestPath = join(testDir, "build1.json");
    const outputPath = join(testDir, "output1.ts");
    
    const manager = new ManifestManager(manifestPath);
    const registry = new FactoryRegistry();
    
    // Register test factory
    const factory = createTestFactory("test_factory", "export const name = '{{name}}';");
    registry.register(factory);
    
    // Add factory call
    manager.addFactoryCall({
      id: "test-1",
      factory: "test_factory",
      params: { name: "TestValue" },
      outputPath,
    });
    
    await manager.save();
    
    // Build
    const producer = new Producer(manager.getManifest(), registry);
    const result = await producer.buildAll();
    
    assertEquals(result.success, true);
    assertEquals(result.generated.length, 1);
    assertEquals(result.errors.length, 0);
    
    // Check output file
    const content = await Deno.readTextFile(outputPath);
    assertStringIncludes(content, "// @codefactory:start id=\"test-1\"");
    assertStringIncludes(content, "export const name = 'TestValue';");
    assertStringIncludes(content, "// @codefactory:end");
  });

  await t.step("should build multiple factory calls in order", async () => {
    const manifestPath = join(testDir, "build2.json");
    const output1 = join(testDir, "output2a.ts");
    const output2 = join(testDir, "output2b.ts");
    
    const manager = new ManifestManager(manifestPath);
    const registry = new FactoryRegistry();
    
    const factory = createTestFactory("test_factory", "export const x = '{{name}}';");
    registry.register(factory);
    
    // Add two independent calls
    manager.addFactoryCall({
      id: "first",
      factory: "test_factory",
      params: { name: "First" },
      outputPath: output1,
    });
    
    manager.addFactoryCall({
      id: "second",
      factory: "test_factory",
      params: { name: "Second" },
      outputPath: output2,
    });
    
    await manager.save();
    
    const producer = new Producer(manager.getManifest(), registry);
    const result = await producer.buildAll();
    
    assertEquals(result.success, true);
    assertEquals(result.generated.length, 2);
    assertEquals(result.errors.length, 0);
    
    const content1 = await Deno.readTextFile(output1);
    assertStringIncludes(content1, "First");
    
    const content2 = await Deno.readTextFile(output2);
    assertStringIncludes(content2, "Second");
  });

  await cleanup();
});

Deno.test("Producer - marker replacement", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should replace content between markers", async () => {
    const manifestPath = join(testDir, "replace1.json");
    const outputPath = join(testDir, "replace1.ts");
    
    // Create existing file with markers
    await Deno.writeTextFile(
      outputPath,
      `// Header comment\n\n` +
      `// @codefactory:start id="test-1"\n` +
      `export const old = 'old';\n` +
      `// @codefactory:end\n\n` +
      `// Footer comment`
    );
    
    const manager = new ManifestManager(manifestPath);
    const registry = new FactoryRegistry();
    
    const factory = createTestFactory("test_factory", "export const name = '{{name}}';");
    registry.register(factory);
    
    manager.addFactoryCall({
      id: "test-1",
      factory: "test_factory",
      params: { name: "New" },
      outputPath,
    });
    
    await manager.save();
    
    const producer = new Producer(manager.getManifest(), registry);
    const result = await producer.buildAll();
    
    assertEquals(result.success, true);
    assertEquals(result.errors.length, 0);
    
    const content = await Deno.readTextFile(outputPath);
    assertStringIncludes(content, "// Header comment");
    assertStringIncludes(content, "// Footer comment");
    assertStringIncludes(content, "export const name = 'New';");
    assertEquals(content.includes("old"), false);
  });

  await t.step("should error if file exists without markers", async () => {
    const manifestPath = join(testDir, "replace2.json");
    const outputPath = join(testDir, "replace2.ts");
    
    // Create file WITHOUT markers
    await Deno.writeTextFile(
      outputPath,
      `export const existing = 'code';`
    );
    
    const manager = new ManifestManager(manifestPath);
    const registry = new FactoryRegistry();
    
    const factory = createTestFactory("test_factory", "export const x = '{{name}}';");
    registry.register(factory);
    
    manager.addFactoryCall({
      id: "test-2",
      factory: "test_factory",
      params: { name: "Test" },
      outputPath,
    });
    
    await manager.save();
    
    const producer = new Producer(manager.getManifest(), registry);
    const result = await producer.buildAll();
    
    assertEquals(result.success, false);
    assertEquals(result.errors.length, 1);
    assertStringIncludes(result.errors[0].error, "has no marker");
  });

  await cleanup();
});

Deno.test("Producer - dependency ordering", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should build in dependency order", async () => {
    const manifestPath = join(testDir, "deps1.json");
    const output1 = join(testDir, "deps1a.ts");
    const output2 = join(testDir, "deps1b.ts");
    const output3 = join(testDir, "deps1c.ts");
    
    const manager = new ManifestManager(manifestPath);
    const registry = new FactoryRegistry();
    
    const factory = createTestFactory("test_factory", "export const x = '{{name}}';");
    registry.register(factory);
    
    // Add in wrong order, but with dependencies
    manager.addFactoryCall({
      id: "a",
      factory: "test_factory",
      params: { name: "A" },
      outputPath: output1,
    });
    
    manager.addFactoryCall({
      id: "b",
      factory: "test_factory",
      params: { name: "B" },
      outputPath: output2,
      dependsOn: ["a"],
    });
    
    manager.addFactoryCall({
      id: "c",
      factory: "test_factory",
      params: { name: "C" },
      outputPath: output3,
      dependsOn: ["b"],
    });
    
    await manager.save();
    
    const producer = new Producer(manager.getManifest(), registry);
    const result = await producer.buildAll();
    
    assertEquals(result.success, true);
    assertEquals(result.generated.length, 3);
    
    // Check order by file paths
    assertEquals(result.generated[0], output1);
    assertEquals(result.generated[1], output2);
    assertEquals(result.generated[2], output3);
  });

  await cleanup();
});

Deno.test("Producer - build specific IDs", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should build only specified IDs", async () => {
    const manifestPath = join(testDir, "specific1.json");
    const output1 = join(testDir, "specific1a.ts");
    const output2 = join(testDir, "specific1b.ts");
    const output3 = join(testDir, "specific1c.ts");
    
    const manager = new ManifestManager(manifestPath);
    const registry = new FactoryRegistry();
    
    const factory = createTestFactory("test_factory", "export const x = '{{name}}';");
    registry.register(factory);
    
    manager.addFactoryCall({
      id: "one",
      factory: "test_factory",
      params: { name: "One" },
      outputPath: output1,
    });
    
    manager.addFactoryCall({
      id: "two",
      factory: "test_factory",
      params: { name: "Two" },
      outputPath: output2,
    });
    
    manager.addFactoryCall({
      id: "three",
      factory: "test_factory",
      params: { name: "Three" },
      outputPath: output3,
    });
    
    await manager.save();
    
    const producer = new Producer(manager.getManifest(), registry);
    const result = await producer.build(["one", "three"]);
    
    assertEquals(result.success, true);
    assertEquals(result.generated.length, 2);
    
    // Check only specified files were created
    assertEquals(await fileExists(output1), true);
    assertEquals(await fileExists(output2), false);
    assertEquals(await fileExists(output3), true);
  });

  await cleanup();
});

Deno.test("Producer - dry run", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should preview without writing files", async () => {
    const manifestPath = join(testDir, "dryrun1.json");
    const outputPath = join(testDir, "dryrun1.ts");
    
    const manager = new ManifestManager(manifestPath);
    const registry = new FactoryRegistry();
    
    const factory = createTestFactory("test_factory", "export const x = '{{name}}';");
    registry.register(factory);
    
    manager.addFactoryCall({
      id: "test",
      factory: "test_factory",
      params: { name: "Preview" },
      outputPath,
    });
    
    await manager.save();
    
    const producer = new Producer(manager.getManifest(), registry);
    const preview = await producer.dryRun();
    
    assertEquals(preview.willGenerate.length, 1);
    assertEquals(preview.willCreate.length, 1);
    assertEquals(preview.willCreate[0], outputPath);
    assertEquals(preview.errors.length, 0);
    
    // File should NOT be created
    assertEquals(await fileExists(outputPath), false);
  });

  await cleanup();
});

Deno.test("Producer - error handling", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should report factory not found", async () => {
    const manifestPath = join(testDir, "error1.json");
    const outputPath = join(testDir, "error1.ts");
    
    const manager = new ManifestManager(manifestPath);
    const registry = new FactoryRegistry();
    
    // Don't register the factory
    manager.addFactoryCall({
      id: "test",
      factory: "nonexistent_factory",
      params: {},
      outputPath,
    });
    
    await manager.save();
    
    const producer = new Producer(manager.getManifest(), registry);
    const result = await producer.buildAll();
    
    assertEquals(result.success, false);
    assertEquals(result.errors.length, 1);
    assertStringIncludes(result.errors[0].error, "not found");
  });

  await t.step("should report invalid params", async () => {
    const manifestPath = join(testDir, "error2.json");
    const outputPath = join(testDir, "error2.ts");
    
    const manager = new ManifestManager(manifestPath);
    const registry = new FactoryRegistry();
    
    // Create factory definition with validation
    const factoryDef = {
      name: "test_factory_validating",
      description: "Test",
      params: {
        name: {
          type: "string" as const,
          description: "Name",
          required: true,
        },
      },
      generate: (params: Record<string, unknown>) => {
        if (!params.name || typeof params.name !== "string") {
          throw new Error("Parameter 'name' is required and must be a string");
        }
        return {
          content: `export const x = '${params.name}';`,
        };
      },
    };
    
    registry.register(factoryDef);
    
    // Add call with missing required param
    manager.addFactoryCall({
      id: "test",
      factory: "test_factory_validating",
      params: {}, // Missing 'name'
      outputPath,
    });
    
    await manager.save();
    
    const producer = new Producer(manager.getManifest(), registry);
    const result = await producer.buildAll();
    
    assertEquals(result.success, false);
    assertEquals(result.errors.length, 1);
    // Should have validation error
    assertStringIncludes(result.errors[0].error, "name");
  });

  await cleanup();
});

Deno.test("Producer - template file markers", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should use template markers for .hbs files", async () => {
    const manifestPath = join(testDir, "template-markers.json");
    const outputPath = join(testDir, "test.hbs");
    
    const manager = new ManifestManager(manifestPath);
    const registry = new FactoryRegistry();
    
    const factory = createTestFactory("hbs_factory", "{{componentName}}");
    registry.register(factory);
    
    manager.addFactoryCall({
      id: "test-hbs",
      factory: "hbs_factory",
      params: { componentName: "Button" },
      outputPath,
    });
    await manager.save();
    
    const producer = new Producer(manager.getManifest(), registry, manifestPath);
    await producer.buildAll();
    
    const content = await Deno.readTextFile(outputPath);
    // Should use Handlebars comment markers
    assertEquals(content.includes("{{!-- @codefactory:start"), true);
    assertEquals(content.includes("{{!-- @codefactory:end"), true);
  });

  await cleanup();
});

Deno.test("Producer - relative path resolution", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should resolve relative paths from manifest directory", async () => {
    const manifestPath = join(testDir, "manifest.json");
    const outputPath = "relative/output.ts"; // Relative path
    
    const manager = new ManifestManager(manifestPath);
    const registry = new FactoryRegistry();
    
    const factory = createTestFactory("rel_factory", "test");
    registry.register(factory);
    
    manager.addFactoryCall({
      id: "relative-path",
      factory: "rel_factory",
      params: {},
      outputPath,
    });
    await manager.save();
    
    const producer = new Producer(manager.getManifest(), registry, manifestPath);
    await producer.buildAll();
    
    // Should create file relative to manifest directory
    const resolvedPath = join(testDir, outputPath);
    const exists = await fileExists(resolvedPath);
    assertEquals(exists, true);
  });

  await cleanup();
});

Deno.test("Producer - edge cases", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should handle non-Error exceptions", async () => {
    const manifestPath = join(testDir, "non-error.json");
    
    const manager = new ManifestManager(manifestPath);
    const registry = new FactoryRegistry();
    
    // Register factory that throws non-Error
    const badFactory: FactoryDefinition = {
      name: "throws_string",
      description: "Throws string",
      params: {},
      generate: () => {
        throw "This is a string error"; // Not an Error object
      },
    };
    registry.register(badFactory);
    
    manager.addFactoryCall({
      id: "bad-call",
      factory: "throws_string",
      params: {},
      outputPath: join(testDir, "bad.ts"),
    });
    await manager.save();
    
    const producer = new Producer(manager.getManifest(), registry, manifestPath);
    const result = await producer.buildAll();
    
    assertEquals(result.success, false);
    assertEquals(result.errors.length, 1);
    assertEquals(result.errors[0].error, "This is a string error");
    assertEquals(result.errors[0].stack, undefined);
  });

  await cleanup();
});

// Helper function
async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}
