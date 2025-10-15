import { assertEquals, assertRejects } from "@std/assert";
import { FactoryRegistry } from "../registry.ts";

Deno.test("FactoryRegistry - autoRegister", async (t) => {
  await t.step("should register single factory from directory with one file", async () => {
    const registry = new FactoryRegistry();
    
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href,
      { pattern: "test-single.ts" }
    );
    
    const factories = registry.list();
    assertEquals(factories.length, 1);
    assertEquals(factories[0].name, "test_factory");
  });

  await t.step("should register multiple factories from same file", async () => {
    const registry = new FactoryRegistry();
    
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href,
      { pattern: "multiple-*.ts" }
    );
    
    const factories = registry.list();
    assertEquals(factories.length, 2);
    const names = factories.map(f => f.name).sort();
    assertEquals(names[0], "factory_one");
    assertEquals(names[1], "factory_two");
  });

  await t.step("should register all factories from directory", async () => {
    const registry = new FactoryRegistry();
    
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href
    );
    
    const factories = registry.list();
    // Should find: 
    // - test-single.ts (1 factory)
    // - multiple-factories.ts (2 factories)
    // - my-factory.factory.ts (1 factory)
    // - test-template.hbs (1 factory)
    // Should exclude: index.ts, invalid-factory.ts (not a valid factory)
    assertEquals(factories.length, 5);
  });

  await t.step("should exclude index.ts by default", async () => {
    const registry = new FactoryRegistry();
    
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href
    );
    
    const factories = registry.list();
    const names = factories.map(f => f.name);
    assertEquals(names.includes("should_not_register"), false);
  });

  await t.step("should respect pattern option", async () => {
    const registry = new FactoryRegistry();
    
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href,
      { pattern: "*.factory.ts" }
    );
    
    const factories = registry.list();
    // Should only find my-factory.factory.ts (index.ts is excluded by default)
    assertEquals(factories.length, 1);
    assertEquals(factories[0].name, "factory_with_suffix");
  });

  await t.step("should respect exclude patterns", async () => {
    const registry = new FactoryRegistry();
    
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href,
      { exclude: ["index.ts", "multiple-*.ts"] }
    );
    
    const factories = registry.list();
    const names = factories.map(f => f.name);
    // Should not include factories from multiple-factories.ts
    assertEquals(names.includes("factory_one"), false);
    assertEquals(names.includes("factory_two"), false);
  });

  await t.step("should discover factories recursively", async () => {
    const registry = new FactoryRegistry();
    
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href,
      { recursive: true }
    );
    
    const factories = registry.list();
    const names = factories.map(f => f.name);
    // Should include nested factory from subdirectory
    assertEquals(names.includes("nested_factory"), true);
  });

  await t.step("should not discover nested factories without recursive option", async () => {
    const registry = new FactoryRegistry();
    
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href,
      { recursive: false }
    );
    
    const factories = registry.list();
    const names = factories.map(f => f.name);
    // Should not include nested factory
    assertEquals(names.includes("nested_factory"), false);
  });

  await t.step("should throw error on duplicate factory names", async () => {
    const registry = new FactoryRegistry();
    
    // Register first time
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href,
      { pattern: "test-single.ts" }
    );
    
    // Try to register again - should throw
    await assertRejects(
      async () => {
        await registry.autoRegister(
          new URL("./fixtures/auto-register/", import.meta.url).href,
          { pattern: "test-single.ts" }
        );
      },
      Error,
      'Factory "test_factory" is already registered'
    );
  });

  await t.step("should handle non-existent directory gracefully", async () => {
    const registry = new FactoryRegistry();
    
    // Should not throw, just return empty
    await registry.autoRegister(
      new URL("./fixtures/non-existent/", import.meta.url).href
    );
    
    const factories = registry.list();
    assertEquals(factories.length, 0);
  });

  await t.step("should ignore files with invalid factories", async () => {
    const registry = new FactoryRegistry();
    
    // invalid-factory.ts has a broken export, should be ignored with warning
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href
    );
    
    // Should still register valid factories
    const factories = registry.list();
    assertEquals(factories.length >= 4, true);
  });

  await t.step("should load .hbs template files", async () => {
    const registry = new FactoryRegistry();
    
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href,
      { pattern: "*.hbs" }
    );
    
    const factories = registry.list();
    assertEquals(factories.length, 1);
    assertEquals(factories[0].name, "hbs_factory");
  });
});

Deno.test("FactoryRegistry - pattern matching", async (t) => {
  await t.step("should match wildcard patterns", async () => {
    const registry = new FactoryRegistry();
    
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href,
      { pattern: "test-*.ts" }
    );
    
    const factories = registry.list();
    assertEquals(factories.length, 1);
    assertEquals(factories[0].name, "test_factory");
  });

  await t.step("should match complex patterns", async () => {
    const registry = new FactoryRegistry();
    
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href,
      { pattern: "*-factory.*.ts" }
    );
    
    const factories = registry.list();
    assertEquals(factories.length, 1);
    assertEquals(factories[0].name, "factory_with_suffix");
  });
});

Deno.test("FactoryRegistry - manual + auto registration", async (t) => {
  await t.step("should work with mixed manual and auto registration", async () => {
    const registry = new FactoryRegistry();
    
    // Manually register a factory
    registry.register({
      name: "manual_factory",
      description: "Manually registered",
      params: {},
      generate: () => ({ content: "manual" }),
    });
    
    // Auto-register more factories
    await registry.autoRegister(
      new URL("./fixtures/auto-register/", import.meta.url).href,
      { pattern: "test-single.ts" }
    );
    
    const factories = registry.list();
    assertEquals(factories.length, 2);
    const names = factories.map(f => f.name);
    assertEquals(names.includes("manual_factory"), true);
    assertEquals(names.includes("test_factory"), true);
  });
});
