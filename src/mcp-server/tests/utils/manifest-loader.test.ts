import { assertEquals, assertExists } from "@std/assert";
import { getManifestPath, loadManifest } from "../../utils/manifest-loader.ts";
import { join } from "@std/path";

const testDir = join(
  new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
  "../fixtures"
);

Deno.test("getManifestPath - uses default", () => {
  const path = getManifestPath();
  assertEquals(path, "./codefactory.manifest.json");
});

Deno.test("getManifestPath - uses custom path", () => {
  const customPath = "/custom/path/manifest.json";
  const path = getManifestPath(customPath);
  assertEquals(path, customPath);
});

Deno.test("getManifestPath - uses environment variable", () => {
  const envPath = "/env/path/manifest.json";
  Deno.env.set("CODEFACTORY_MANIFEST", envPath);
  
  const path = getManifestPath();
  assertEquals(path, envPath);
  
  // Cleanup
  Deno.env.delete("CODEFACTORY_MANIFEST");
});

Deno.test("getManifestPath - custom path overrides environment", () => {
  const envPath = "/env/path/manifest.json";
  const customPath = "/custom/path/manifest.json";
  
  Deno.env.set("CODEFACTORY_MANIFEST", envPath);
  
  const path = getManifestPath(customPath);
  assertEquals(path, customPath);
  
  // Cleanup
  Deno.env.delete("CODEFACTORY_MANIFEST");
});

Deno.test("loadManifest - loads existing manifest", async () => {
  const manifestPath = join(testDir, "test-manifest.json");
  const manager = await loadManifest(manifestPath);
  
  assertExists(manager);
  const manifest = manager.getManifest();
  assertExists(manifest);
  assertEquals(manifest.version, "1.0.0");
});

Deno.test("loadManifest - creates new if doesn't exist", async () => {
  const tempPath = join(testDir, "temp-manifest.json");
  
  // Ensure it doesn't exist
  try {
    await Deno.remove(tempPath);
  } catch {
    // Ignore if doesn't exist
  }
  
  const manager = await loadManifest(tempPath);
  
  assertExists(manager);
  const manifest = manager.getManifest();
  assertExists(manifest);
  assertEquals(manifest.version, "1.0.0");
  assertEquals(manifest.factories.length, 0);
  
  // Cleanup
  try {
    await Deno.remove(tempPath);
  } catch {
    // Ignore cleanup errors
  }
});

Deno.test("loadManifest - with environment variable", async () => {
  const manifestPath = join(testDir, "test-manifest.json");
  Deno.env.set("CODEFACTORY_MANIFEST", manifestPath);
  
  const manager = await loadManifest();
  
  assertExists(manager);
  const manifest = manager.getManifest();
  assertEquals(manifest.version, "1.0.0");
  
  // Cleanup
  Deno.env.delete("CODEFACTORY_MANIFEST");
});
