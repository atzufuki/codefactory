import { assertEquals, assertExists } from "@std/assert";
import { getFactoriesDir, loadRegistry } from "../../utils/factory-registry.ts";
import { join } from "@std/path";

Deno.test("getFactoriesDir - uses default", () => {
  const dir = getFactoriesDir();
  assertEquals(dir, "./factories");
});

Deno.test("getFactoriesDir - uses custom path", () => {
  const customPath = "/custom/path";
  const dir = getFactoriesDir(customPath);
  assertEquals(dir, customPath);
});

Deno.test("getFactoriesDir - uses environment variable", () => {
  const envPath = "/env/path";
  Deno.env.set("CODEFACTORY_FACTORIES_DIR", envPath);
  
  const dir = getFactoriesDir();
  assertEquals(dir, envPath);
  
  // Cleanup
  Deno.env.delete("CODEFACTORY_FACTORIES_DIR");
});

Deno.test("getFactoriesDir - custom path overrides environment", () => {
  const envPath = "/env/path";
  const customPath = "/custom/path";
  
  Deno.env.set("CODEFACTORY_FACTORIES_DIR", envPath);
  
  const dir = getFactoriesDir(customPath);
  assertEquals(dir, customPath);
  
  // Cleanup
  Deno.env.delete("CODEFACTORY_FACTORIES_DIR");
});

Deno.test("loadRegistry - loads built-ins and user factories", async () => {
  const registry = await loadRegistry();
  
  // Should have loaded built-in factories
  assertExists(registry);
  
  // Should have the meta-factory
  const factory = registry.get("factory");
  assertExists(factory);
  const metadata = factory.getMetadata();
  assertEquals(metadata.name, "factory");
});

Deno.test("loadRegistry - handles non-existent directory gracefully", async () => {
  const registry = await loadRegistry("/non/existent/path");
  
  // Should still have built-in factories
  assertExists(registry);
  const factory = registry.get("factory");
  assertExists(factory);
});

Deno.test("loadRegistry - with custom pattern", async () => {
  const registry = await loadRegistry(undefined, "*.hbs");
  
  // Should still load factories
  assertExists(registry);
  const factory = registry.get("factory");
  assertExists(factory);
});

Deno.test("loadRegistry - handles absolute path", async () => {
  const absolutePath = join(Deno.cwd(), "factories");
  const registry = await loadRegistry(absolutePath);
  
  assertExists(registry);
});

Deno.test("loadRegistry - handles Windows absolute path", async () => {
  // Test Windows-style path handling
  const registry = await loadRegistry("C:\\Users\\test\\factories");
  
  // Should not crash, even if path doesn't exist
  assertExists(registry);
});
