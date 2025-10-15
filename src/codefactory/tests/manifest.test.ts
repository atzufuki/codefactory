import { assertEquals, assertThrows } from "@std/assert";
import { ManifestManager } from "../manifest.ts";
import { join } from "@std/path";

const testDir = join(
  new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
  "fixtures",
  "manifest"
);

// Cleanup test directory before/after tests
async function cleanup() {
  try {
    await Deno.remove(testDir, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }
}

Deno.test("ManifestManager - create and load", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should create new manifest", async () => {
    const manifestPath = join(testDir, "test1.json");
    const manager = await ManifestManager.create(manifestPath);
    
    const manifest = manager.getManifest();
    assertEquals(manifest.version, "1.0.0");
    assertEquals(manifest.factories.length, 0);
    
    // File should exist
    const content = await Deno.readTextFile(manifestPath);
    const parsed = JSON.parse(content);
    assertEquals(parsed.version, "1.0.0");
  });

  await t.step("should load existing manifest", async () => {
    const manifestPath = join(testDir, "test2.json");
    await Deno.writeTextFile(manifestPath, JSON.stringify({
      version: "1.0.0",
      generated: "2025-10-14T10:00:00Z",
      factories: [{
        id: "test",
        factory: "test_factory",
        params: {},
        outputPath: "test.ts",
        createdAt: "2025-10-14T10:00:00Z",
      }],
    }));
    
    const manager = await ManifestManager.load(manifestPath);
    const manifest = manager.getManifest();
    
    assertEquals(manifest.factories.length, 1);
    assertEquals(manifest.factories[0].id, "test");
  });

  await t.step("should create new if file doesn't exist", async () => {
    const manifestPath = join(testDir, "nonexistent.json");
    const manager = await ManifestManager.load(manifestPath);
    
    assertEquals(manager.getManifest().factories.length, 0);
  });

  await cleanup();
});

Deno.test("ManifestManager - addFactoryCall", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should add factory call", () => {
    const manifestPath = join(testDir, "add.json");
    const manager = new ManifestManager(manifestPath);
    
    manager.addFactoryCall({
      id: "test-1",
      factory: "test_factory",
      params: { name: "test" },
      outputPath: "test.ts",
    });
    
    const calls = manager.getAllFactoryCalls();
    assertEquals(calls.length, 1);
    assertEquals(calls[0].id, "test-1");
    assertEquals(calls[0].factory, "test_factory");
    assertEquals(typeof calls[0].createdAt, "string");
  });

  await t.step("should reject duplicate ID", () => {
    const manager = new ManifestManager(join(testDir, "dup.json"));
    
    manager.addFactoryCall({
      id: "test",
      factory: "test_factory",
      params: {},
      outputPath: "test.ts",
    });
    
    assertThrows(
      () => {
        manager.addFactoryCall({
          id: "test",
          factory: "another_factory",
          params: {},
          outputPath: "test2.ts",
        });
      },
      Error,
      'already exists'
    );
  });

  await t.step("should validate dependencies exist", () => {
    const manager = new ManifestManager(join(testDir, "deps.json"));
    
    assertThrows(
      () => {
        manager.addFactoryCall({
          id: "test",
          factory: "test_factory",
          params: {},
          outputPath: "test.ts",
          dependsOn: ["nonexistent"],
        });
      },
      Error,
      'not found in manifest'
    );
  });

  await cleanup();
});

Deno.test("ManifestManager - removeFactoryCall", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should remove factory call", () => {
    const manager = new ManifestManager(join(testDir, "remove.json"));
    
    manager.addFactoryCall({
      id: "test",
      factory: "test_factory",
      params: {},
      outputPath: "test.ts",
    });
    
    assertEquals(manager.getAllFactoryCalls().length, 1);
    
    manager.removeFactoryCall("test");
    
    assertEquals(manager.getAllFactoryCalls().length, 0);
  });

  await t.step("should error if not found", () => {
    const manager = new ManifestManager(join(testDir, "remove2.json"));
    
    assertThrows(
      () => manager.removeFactoryCall("nonexistent"),
      Error,
      'not found'
    );
  });

  await t.step("should prevent removing if others depend on it", () => {
    const manager = new ManifestManager(join(testDir, "remove3.json"));
    
    manager.addFactoryCall({
      id: "base",
      factory: "test_factory",
      params: {},
      outputPath: "base.ts",
    });
    
    manager.addFactoryCall({
      id: "dependent",
      factory: "test_factory",
      params: {},
      outputPath: "dependent.ts",
      dependsOn: ["base"],
    });
    
    assertThrows(
      () => manager.removeFactoryCall("base"),
      Error,
      'other factories depend on it'
    );
  });

  await cleanup();
});

Deno.test("ManifestManager - updateFactoryCall", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should update factory call", () => {
    const manager = new ManifestManager(join(testDir, "update.json"));
    
    manager.addFactoryCall({
      id: "test",
      factory: "test_factory",
      params: { name: "old" },
      outputPath: "test.ts",
    });
    
    manager.updateFactoryCall("test", {
      params: { name: "new" },
      outputPath: "test2.ts",
    });
    
    const call = manager.getFactoryCall("test");
    assertEquals(call?.params.name, "new");
    assertEquals(call?.outputPath, "test2.ts");
  });

  await t.step("should error if not found", () => {
    const manager = new ManifestManager(join(testDir, "update2.json"));
    
    assertThrows(
      () => manager.updateFactoryCall("nonexistent", {}),
      Error,
      'not found'
    );
  });

  await t.step("should validate new dependencies exist", () => {
    const manager = new ManifestManager(join(testDir, "update3.json"));
    
    manager.addFactoryCall({
      id: "test",
      factory: "test_factory",
      params: {},
      outputPath: "test.ts",
    });
    
    assertThrows(
      () => manager.updateFactoryCall("test", { dependsOn: ["nonexistent"] }),
      Error,
      'not found'
    );
  });

  await t.step("should prevent self-dependency", () => {
    const manager = new ManifestManager(join(testDir, "update4.json"));
    
    manager.addFactoryCall({
      id: "test",
      factory: "test_factory",
      params: {},
      outputPath: "test.ts",
    });
    
    assertThrows(
      () => manager.updateFactoryCall("test", { dependsOn: ["test"] }),
      Error,
      'cannot depend on itself'
    );
  });

  await t.step("should merge params instead of replacing", () => {
    const manager = new ManifestManager(join(testDir, "update5.json"));
    
    // Add factory call with multiple params
    manager.addFactoryCall({
      id: "test",
      factory: "factory",
      params: { 
        name: "web_component",
        description: "Generate a Web Component",
        template: "export const {{name}} = {};",
        outputPath: "src/{{name}}.ts"
      },
      outputPath: "factories/web_component.hbs",
    });
    
    // Update only one param - others should be preserved
    manager.updateFactoryCall("test", {
      params: { outputPath: "src/components/{{name}}.ts" }
    });
    
    const call = manager.getFactoryCall("test");
    
    // Check that the updated param changed
    assertEquals(call?.params.outputPath, "src/components/{{name}}.ts");
    
    // Check that other params were preserved (not deleted)
    assertEquals(call?.params.name, "web_component", "name should be preserved");
    assertEquals(call?.params.description, "Generate a Web Component", "description should be preserved");
    assertEquals(call?.params.template, "export const {{name}} = {};", "template should be preserved");
  });

  await cleanup();
});

Deno.test("ManifestManager - getExecutionOrder", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should return calls in dependency order", () => {
    const manager = new ManifestManager(join(testDir, "order.json"));
    
    // Add in any order, but dependencies must exist
    manager.addFactoryCall({
      id: "a",
      factory: "test",
      params: {},
      outputPath: "a.ts",
    });
    
    manager.addFactoryCall({
      id: "b",
      factory: "test",
      params: {},
      outputPath: "b.ts",
      dependsOn: ["a"],
    });
    
    manager.addFactoryCall({
      id: "c",
      factory: "test",
      params: {},
      outputPath: "c.ts",
      dependsOn: ["b"],
    });
    
    const order = manager.getExecutionOrder();
    
    assertEquals(order.length, 3);
    assertEquals(order[0].id, "a");
    assertEquals(order[1].id, "b");
    assertEquals(order[2].id, "c");
  });

  await t.step("should detect circular dependencies", () => {
    const manager = new ManifestManager(join(testDir, "circular.json"));
    
    // Add "a" first without dependency
    manager.addFactoryCall({
      id: "a",
      factory: "test",
      params: {},
      outputPath: "a.ts",
    });
    
    // Add "b" depending on "a"
    manager.addFactoryCall({
      id: "b",
      factory: "test",
      params: {},
      outputPath: "b.ts",
      dependsOn: ["a"],
    });
    
    // Now update "a" to depend on "b" - creates circular dependency
    manager.updateFactoryCall("a", {
      dependsOn: ["b"],
    });
    
    assertThrows(
      () => manager.getExecutionOrder(),
      Error,
      'Circular dependency'
    );
  });

  await t.step("should handle independent calls", () => {
    const manager = new ManifestManager(join(testDir, "independent.json"));
    
    manager.addFactoryCall({
      id: "a",
      factory: "test",
      params: {},
      outputPath: "a.ts",
    });
    
    manager.addFactoryCall({
      id: "b",
      factory: "test",
      params: {},
      outputPath: "b.ts",
    });
    
    const order = manager.getExecutionOrder();
    assertEquals(order.length, 2);
  });

  await cleanup();
});

Deno.test("ManifestManager - save and load", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should save and load manifest", async () => {
    const manifestPath = join(testDir, "save.json");
    const manager = new ManifestManager(manifestPath);
    
    manager.addFactoryCall({
      id: "test",
      factory: "test_factory",
      params: { name: "value" },
      outputPath: "test.ts",
    });
    
    await manager.save();
    
    const loaded = await ManifestManager.load(manifestPath);
    const calls = loaded.getAllFactoryCalls();
    
    assertEquals(calls.length, 1);
    assertEquals(calls[0].id, "test");
    assertEquals(calls[0].params.name, "value");
  });

  await cleanup();
});
