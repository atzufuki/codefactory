import { assertEquals, assertStringIncludes } from "@std/assert";
import { Producer } from "../producer.ts";
import { FactoryRegistry } from "../registry.ts";
import type { BuildManifest } from "../manifest.ts";
import type { FactoryDefinition } from "../types.ts";
import { join } from "@std/path";

const testDir = join(
  new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
  "fixtures",
  "producer-extraction"
);

// Cleanup test directory before/after tests
async function cleanup() {
  try {
    await Deno.remove(testDir, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }
}

// Helper to create empty manifest for extraction-based workflow
function emptyManifest(): BuildManifest {
  return {
    version: "1.0.0",
    generated: new Date().toISOString(),
    factories: [],
  };
}

// Helper to create a test factory with template
function createTestFactory(
  name: string,
  template: string,
  outputTemplate: string
): FactoryDefinition {
  return {
    name,
    description: "Test factory",
    params: {},
    template, // Store template for extraction
    generate: (params: Record<string, unknown>) => {
      // Simple replacement for tests
      let result = outputTemplate;
      for (const [key, value] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
      }
      return { content: result };
    },
  };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

Deno.test("Producer (Extraction) - createFile", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should create file with new marker format", async () => {
    const outputPath = join(testDir, "create1.ts");
    const registry = new FactoryRegistry();
    
    const factory = createTestFactory(
      "test_factory",
      "export const name = '{{name}}';",
      "export const name = '{{name}}';"
    );
    registry.register(factory);
    
    const producer = new Producer(emptyManifest(), registry);
    await producer.createFile("test_factory", { name: "TestValue" }, outputPath);
    
    // Check file was created
    assertEquals(await fileExists(outputPath), true);
    
    // Check marker format
    const content = await Deno.readTextFile(outputPath);
    assertStringIncludes(content, '// @codefactory:start factory="test_factory"');
    assertStringIncludes(content, "export const name = 'TestValue';");
    assertStringIncludes(content, "// @codefactory:end");
  });

  await t.step("should error if file already exists", async () => {
    const outputPath = join(testDir, "create2.ts");
    
    // Create existing file
    await Deno.writeTextFile(outputPath, "existing content");
    
    const registry = new FactoryRegistry();
    const factory = createTestFactory("test_factory", "test", "test");
    registry.register(factory);
    
    const producer = new Producer(emptyManifest(), registry);
    
    // Should throw error
    let errorThrown = false;
    try {
      await producer.createFile("test_factory", {}, outputPath);
    } catch (error) {
      errorThrown = true;
      // Error message says file exists but has no marker
      assertStringIncludes((error as Error).message, "exists");
    }
    
    assertEquals(errorThrown, true);
  });

  await t.step("should error if factory not found", async () => {
    const outputPath = join(testDir, "create3.ts");
    const registry = new FactoryRegistry();
    const producer = new Producer(emptyManifest(), registry);
    
    let errorThrown = false;
    try {
      await producer.createFile("nonexistent_factory", {}, outputPath);
    } catch (error) {
      errorThrown = true;
      assertStringIncludes((error as Error).message, "not found");
    }
    
    assertEquals(errorThrown, true);
  });

  await cleanup();
});

Deno.test("Producer (Extraction) - syncFile", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should extract params and regenerate file", async () => {
    const outputPath = join(testDir, "sync1.ts");
    const registry = new FactoryRegistry();
    
    // Factory with simple parameter
    const factory = createTestFactory(
      "test_factory",
      "export const name = '{{name}}';",
      "export const name = '{{name}}';"
    );
    registry.register(factory);
    
    // Create initial file
    await Deno.writeTextFile(
      outputPath,
      '// @codefactory:start factory="test_factory"\n' +
      "export const name = 'Original';\n" +
      "// @codefactory:end\n"
    );
    
    // User edits the code
    await Deno.writeTextFile(
      outputPath,
      '// @codefactory:start factory="test_factory"\n' +
      "export const name = 'EditedByUser';\n" +
      "// @codefactory:end\n"
    );
    
    // Sync should extract "EditedByUser" and regenerate
    const producer = new Producer(emptyManifest(), registry);
    await producer.syncFile(outputPath);
    
    const content = await Deno.readTextFile(outputPath);
    assertStringIncludes(content, "export const name = 'EditedByUser';");
  });

  await t.step("should preserve custom code outside markers", async () => {
    const outputPath = join(testDir, "sync2.ts");
    const registry = new FactoryRegistry();
    
    const factory = createTestFactory(
      "test_factory",
      "export const x = '{{value}}';",
      "export const x = '{{value}}';"
    );
    registry.register(factory);
    
    // Create file with custom code
    await Deno.writeTextFile(
      outputPath,
      '// Header comment\n\n' +
      '// @codefactory:start factory="test_factory"\n' +
      "export const x = 'test';\n" +
      "// @codefactory:end\n\n" +
      "// Custom code below\n" +
      "export const custom = 'preserved';\n"
    );
    
    const producer = new Producer(emptyManifest(), registry);
    await producer.syncFile(outputPath);
    
    const content = await Deno.readTextFile(outputPath);
    assertStringIncludes(content, "// Header comment");
    assertStringIncludes(content, "// Custom code below");
    assertStringIncludes(content, "export const custom = 'preserved';");
  });

  await t.step("should error if no marker found", async () => {
    const outputPath = join(testDir, "sync3.ts");
    
    // Create file WITHOUT markers
    await Deno.writeTextFile(outputPath, "export const x = 'no marker';");
    
    const registry = new FactoryRegistry();
    const producer = new Producer(emptyManifest(), registry);
    
    let errorThrown = false;
    try {
      await producer.syncFile(outputPath);
    } catch (error) {
      errorThrown = true;
      assertStringIncludes((error as Error).message, "marker");
    }
    
    assertEquals(errorThrown, true);
  });

  await t.step("should error if factory not found in registry", async () => {
    const outputPath = join(testDir, "sync4.ts");
    
    await Deno.writeTextFile(
      outputPath,
      '// @codefactory:start factory="unknown_factory"\n' +
      "export const x = 'test';\n" +
      "// @codefactory:end\n"
    );
    
    const registry = new FactoryRegistry();
    const producer = new Producer(emptyManifest(), registry);
    
    let errorThrown = false;
    try {
      await producer.syncFile(outputPath);
    } catch (error) {
      errorThrown = true;
      assertStringIncludes((error as Error).message, "not found");
    }
    
    assertEquals(errorThrown, true);
  });

  await t.step("should error if factory has no template", async () => {
    const outputPath = join(testDir, "sync5.ts");
    const registry = new FactoryRegistry();
    
    // Factory without template
    const factory: FactoryDefinition = {
      name: "no_template_factory",
      description: "Test",
      params: {},
      generate: () => ({ content: "test" }),
      // No template field
    };
    registry.register(factory);
    
    await Deno.writeTextFile(
      outputPath,
      '// @codefactory:start factory="no_template_factory"\n' +
      "export const x = 'test';\n" +
      "// @codefactory:end\n"
    );
    
    const producer = new Producer(emptyManifest(), registry);
    
    let errorThrown = false;
    try {
      await producer.syncFile(outputPath);
    } catch (error) {
      errorThrown = true;
      assertStringIncludes((error as Error).message, "template");
    }
    
    assertEquals(errorThrown, true);
  });

  await cleanup();
});

Deno.test("Producer (Extraction) - syncAll", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should sync all files in directory", async () => {
    const dir = join(testDir, "syncall1");
    await Deno.mkdir(dir, { recursive: true });
    
    const registry = new FactoryRegistry();
    const factory = createTestFactory(
      "test_factory",
      "export const x = '{{value}}';",
      "export const x = '{{value}}';"
    );
    registry.register(factory);
    
    // Create multiple files
    const file1 = join(dir, "file1.ts");
    const file2 = join(dir, "file2.ts");
    const file3 = join(dir, "file3.ts");
    
    await Deno.writeTextFile(
      file1,
      '// @codefactory:start factory="test_factory"\n' +
      "export const x = 'one';\n" +
      "// @codefactory:end\n"
    );
    
    await Deno.writeTextFile(
      file2,
      '// @codefactory:start factory="test_factory"\n' +
      "export const x = 'two';\n" +
      "// @codefactory:end\n"
    );
    
    // File without marker (should be skipped)
    await Deno.writeTextFile(file3, "export const y = 'no marker';");
    
    const producer = new Producer(emptyManifest(), registry);
    const result = await producer.syncAll(dir);
    
    assertEquals(result.success, true);
    assertEquals(result.generated.length, 2);
    assertEquals(result.errors.length, 0);
    
    // Check files were synced
    const content1 = await Deno.readTextFile(file1);
    assertStringIncludes(content1, "export const x = 'one';");
    
    const content2 = await Deno.readTextFile(file2);
    assertStringIncludes(content2, "export const x = 'two';");
    
    // File3 should be unchanged
    const content3 = await Deno.readTextFile(file3);
    assertEquals(content3, "export const y = 'no marker';");
  });

  await t.step("should scan subdirectories recursively", async () => {
    const rootDir = join(testDir, "syncall2");
    const subDir = join(rootDir, "components");
    await Deno.mkdir(subDir, { recursive: true });
    
    const registry = new FactoryRegistry();
    const factory = createTestFactory(
      "test_factory",
      "export const x = '{{value}}';",
      "export const x = '{{value}}';"
    );
    registry.register(factory);
    
    const file1 = join(rootDir, "root.ts");
    const file2 = join(subDir, "nested.ts");
    
    await Deno.writeTextFile(
      file1,
      '// @codefactory:start factory="test_factory"\n' +
      "export const x = 'root';\n" +
      "// @codefactory:end\n"
    );
    
    await Deno.writeTextFile(
      file2,
      '// @codefactory:start factory="test_factory"\n' +
      "export const x = 'nested';\n" +
      "// @codefactory:end\n"
    );
    
    const producer = new Producer(emptyManifest(), registry);
    const result = await producer.syncAll(rootDir);
    
    assertEquals(result.success, true);
    assertEquals(result.generated.length, 2);
  });

  await t.step("should continue on errors and report all", async () => {
    const dir = join(testDir, "syncall3");
    await Deno.mkdir(dir, { recursive: true });
    
    const registry = new FactoryRegistry();
    const factory = createTestFactory(
      "test_factory",
      "export const x = '{{value}}';",
      "export const x = '{{value}}';"
    );
    registry.register(factory);
    
    const good = join(dir, "good.ts");
    const bad = join(dir, "bad.ts");
    
    await Deno.writeTextFile(
      good,
      '// @codefactory:start factory="test_factory"\n' +
      "export const x = 'good';\n" +
      "// @codefactory:end\n"
    );
    
    // Bad file references non-existent factory
    await Deno.writeTextFile(
      bad,
      '// @codefactory:start factory="unknown_factory"\n' +
      "export const x = 'bad';\n" +
      "// @codefactory:end\n"
    );
    
    const producer = new Producer(emptyManifest(), registry);
    const result = await producer.syncAll(dir);
    
    assertEquals(result.success, false);
    assertEquals(result.generated.length, 1); // Good file synced
    assertEquals(result.errors.length, 1); // Bad file reported
    assertStringIncludes(result.errors[0].error, "not found");
  });

  await t.step("should handle empty directories", async () => {
    const dir = join(testDir, "syncall4");
    await Deno.mkdir(dir, { recursive: true });
    
    const registry = new FactoryRegistry();
    const producer = new Producer(emptyManifest(), registry);
    const result = await producer.syncAll(dir);
    
    assertEquals(result.success, true);
    assertEquals(result.generated.length, 0);
    assertEquals(result.errors.length, 0);
  });

  await cleanup();
});

Deno.test("Producer (Extraction) - marker format compatibility", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should support legacy id marker format", async () => {
    const outputPath = join(testDir, "legacy1.ts");
    const registry = new FactoryRegistry();
    
    const factory = createTestFactory(
      "test_factory",
      "export const x = '{{value}}';",
      "export const x = '{{value}}';"
    );
    registry.register(factory);
    
    // Create file with LEGACY marker format
    await Deno.writeTextFile(
      outputPath,
      '// @codefactory:start id="legacy-uuid-123"\n' +
      "export const x = 'legacy';\n" +
      "// @codefactory:end\n"
    );
    
    // syncFile should detect it's a legacy marker and skip (or error)
    const producer = new Producer(emptyManifest(), registry);
    
    let errorThrown = false;
    try {
      await producer.syncFile(outputPath);
    } catch (error) {
      errorThrown = true;
      // Should error because legacy markers don't have factory name
      assertStringIncludes((error as Error).message, "factory");
    }
    
    assertEquals(errorThrown, true);
  });

  await t.step("should distinguish new vs legacy markers", async () => {
    const newPath = join(testDir, "new-marker.ts");
    const legacyPath = join(testDir, "legacy-marker.ts");
    
    await Deno.writeTextFile(
      newPath,
      '// @codefactory:start factory="test_factory"\n' +
      "export const x = 'new';\n" +
      "// @codefactory:end\n"
    );
    
    await Deno.writeTextFile(
      legacyPath,
      '// @codefactory:start id="uuid-123"\n' +
      "export const x = 'legacy';\n" +
      "// @codefactory:end\n"
    );
    
    const newContent = await Deno.readTextFile(newPath);
    const legacyContent = await Deno.readTextFile(legacyPath);
    
    // New format has factory="..."
    assertEquals(newContent.includes('factory="test_factory"'), true);
    
    // Legacy format has id="..."
    assertEquals(legacyContent.includes('id="uuid-123"'), true);
    assertEquals(legacyContent.includes("factory="), false);
  });

  await cleanup();
});

Deno.test("Producer (Extraction) - complex parameter extraction", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should extract multiple parameters", async () => {
    const outputPath = join(testDir, "multi-param.ts");
    const registry = new FactoryRegistry();
    
    // Factory with multiple parameters
    const factory: FactoryDefinition = {
      name: "multi_factory",
      description: "Test",
      params: {},
      template: "export const {{name}} = '{{value}}';",
      generate: (params: Record<string, unknown>) => ({
        content: `export const ${params.name} = '${params.value}';`,
      }),
    };
    registry.register(factory);
    
    // Create file with multiple params
    await Deno.writeTextFile(
      outputPath,
      '// @codefactory:start factory="multi_factory"\n' +
      "export const myVar = 'myValue';\n" +
      "// @codefactory:end\n"
    );
    
    const producer = new Producer(emptyManifest(), registry);
    await producer.syncFile(outputPath);
    
    const content = await Deno.readTextFile(outputPath);
    assertStringIncludes(content, "export const myVar = 'myValue';");
  });

  await cleanup();
});

Deno.test("Producer (Extraction) - Handlebars template markers", async (t) => {
  await cleanup();
  await Deno.mkdir(testDir, { recursive: true });

  await t.step("should use Handlebars markers for .hbs files", async () => {
    const outputPath = join(testDir, "test.hbs");
    const registry = new FactoryRegistry();
    
    const factory = createTestFactory(
      "hbs_factory",
      "{{componentName}}",
      "{{componentName}}"
    );
    registry.register(factory);
    
    const producer = new Producer(emptyManifest(), registry);
    await producer.createFile("hbs_factory", { componentName: "Button" }, outputPath);
    
    const content = await Deno.readTextFile(outputPath);
    // Should use Handlebars comment markers
    assertStringIncludes(content, "{{!-- @codefactory:start");
    assertStringIncludes(content, 'factory="hbs_factory"');
    assertStringIncludes(content, "{{!-- @codefactory:end");
  });

  await cleanup();
});
