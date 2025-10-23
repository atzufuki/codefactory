/**
 * Tests for MCP resource handlers (factory catalog)
 */

import { assertEquals, assertExists } from "@std/assert";
import { loadRegistry } from "../utils/factory-registry.ts";

Deno.test("Factory catalog - should list all available factories", async () => {
  const registry = await loadRegistry(undefined, "*.codefactory");
  const catalog = registry.getCatalog();

  assertExists(catalog);
  assertEquals(Array.isArray(catalog), true);
  
  // Should have at least the built-in 'factory' factory
  const factoryMeta = catalog.find((f) => f.name === "factory");
  
  assertExists(factoryMeta);
  assertEquals(factoryMeta.name, "factory");
  assertExists(factoryMeta.description);
  assertExists(factoryMeta.params);
});

Deno.test("Factory catalog - should include parameter details", async () => {
  const registry = await loadRegistry(undefined, "*.codefactory");
  const factory = registry.get("factory");

  assertExists(factory);
  
  const metadata = factory.getMetadata();
  assertEquals(metadata.name, "factory");
  assertExists(metadata.description);
  assertExists(metadata.params);
  
  // Should have required parameters
  const params = metadata.params as Record<string, Record<string, unknown>>;
  assertExists(params.name);
  assertEquals(params.name.type, "string");
  assertEquals(params.name.required, true);
  assertExists(params.name.description);
  
  assertExists(params.description);
  assertEquals(params.description.required, true);
  
  assertExists(params.template);
  assertEquals(params.template.required, true);
});

Deno.test("Factory catalog - should include examples", async () => {
  const registry = await loadRegistry(undefined, "*.codefactory");
  const factory = registry.get("factory");

  assertExists(factory);
  
  const metadata = factory.getMetadata();
  assertExists(metadata.examples);
  assertEquals(Array.isArray(metadata.examples), true);
  
  // Factory should have at least one example
  assertEquals(metadata.examples!.length > 0, true);
  
  const example = metadata.examples![0] as Record<string, unknown>;
  assertExists(example.name);
  assertExists(example.description);
  assertExists(example.template);
});

Deno.test("Factory catalog - getCatalog returns full metadata", async () => {
  const registry = await loadRegistry(undefined, "*.codefactory");
  const catalog = registry.getCatalog();

  for (const factoryMeta of catalog) {
    assertExists(factoryMeta.name);
    assertExists(factoryMeta.description);
    assertExists(factoryMeta.params);
    
    // Each factory should have well-defined parameters
    const params = factoryMeta.params as Record<string, Record<string, unknown>>;
    for (const [paramName, paramDef] of Object.entries(params)) {
      assertExists(paramName);
      assertExists(paramDef.type || paramDef.description);
    }
  }
});

Deno.test("Factory resource URI format", () => {
  const factoryName = "web_component";
  const uri = `codefactory://factory/${factoryName}`;
  
  const match = uri.match(/^codefactory:\/\/factory\/(.+)$/);
  assertExists(match);
  assertEquals(match[1], factoryName);
});

Deno.test("Factory resource URI validation - should reject invalid URIs", () => {
  const invalidUris = [
    "invalid://uri",
    "codefactory://wrong/path",
    "factory/web_component",
    "",
  ];

  for (const uri of invalidUris) {
    const match = uri.match(/^codefactory:\/\/factory\/(.+)$/);
    assertEquals(match, null);
  }
});

Deno.test("Factory parameters - should format correctly for AI", async () => {
  const registry = await loadRegistry(undefined, "*.codefactory");
  const catalog = registry.getCatalog();

  for (const factoryMeta of catalog) {
    const paramList = Object.entries(factoryMeta.params).map(([name, def]) => {
      const paramDef = def as Record<string, unknown>;
      return {
        name,
        type: paramDef.type || "unknown",
        required: paramDef.required || false,
        description: paramDef.description || "No description",
      };
    });

    // Each parameter should have required fields
    for (const param of paramList) {
      assertExists(param.name);
      assertExists(param.type);
      assertEquals(typeof param.required, "boolean");
      assertExists(param.description);
    }
  }
});

