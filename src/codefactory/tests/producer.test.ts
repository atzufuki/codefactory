/**
 * Tests for Producer (metadata-based workflow)
 */

import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { Producer } from "../producer.ts";
import { FactoryRegistry } from "../registry.ts";

Deno.test("Producer.createFile - should create file with metadata", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    registry.register({
        name: "test",
        description: "Test factory",
        params: {},
        generate: (params) => ({ content: `export const ${params.name} = 'test';` }),
      }
    );
    
    const producer = new Producer(registry);
    const outputPath = join(tempDir, "test.ts");
    
    await producer.createFile("test", { name: "Hello" }, outputPath);
    
    const content = await Deno.readTextFile(outputPath);
    assertStringIncludes(content, "@codefactory test");
    assertStringIncludes(content, "name: Hello");
    assertStringIncludes(content, "export const Hello = 'test';");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Producer.createFile - should error if factory not found", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    const producer = new Producer(registry);
    const outputPath = join(tempDir, "test.ts");
    
    await assertRejects(
      () => producer.createFile("nonexistent", {}, outputPath),
      Error,
      'Factory "nonexistent" not found'
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Producer.createFile - should error if file exists", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    registry.register({
        name: "test",
        description: "Test factory",
        params: {},
        generate: () => ({ content: "test" }),
      }
    );
    
    const producer = new Producer(registry);
    const outputPath = join(tempDir, "test.ts");
    
    // Create file first time
    await producer.createFile("test", {}, outputPath);
    
    // Try to create again
    await assertRejects(
      () => producer.createFile("test", {}, outputPath),
      Error,
      "File already exists"
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Producer.createFile - should create nested directories", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    registry.register({
        name: "test",
        description: "Test factory",
        params: {},
        generate: () => ({ content: "test" }),
      }
    );
    
    const producer = new Producer(registry);
    const outputPath = join(tempDir, "nested", "deep", "test.ts");
    
    await producer.createFile("test", {}, outputPath);
    
    const content = await Deno.readTextFile(outputPath);
    assertStringIncludes(content, "@codefactory test");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Producer.syncFile - should sync file with metadata", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    registry.register(
      {
        name: "test",
        description: "Test factory",
        params: {},
        generate: (params) => ({ content: `export const ${params.name} = 'value';` }),
      }
    );
    
    const producer = new Producer(registry);
    const filePath = join(tempDir, "test.ts");
    
    // Create initial file
    await Deno.writeTextFile(
      filePath,
      "/**\n * @codefactory test\n * name: Original\n */\n\nexport const Original = 'value';"
    );
    
    // Sync with updated metadata
    await producer.syncFile(filePath);
    
    const content = await Deno.readTextFile(filePath);
    assertStringIncludes(content, "Original");
    assertStringIncludes(content, "@codefactory test");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Producer.syncFile - should error if no metadata", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    const producer = new Producer(registry);
    const filePath = join(tempDir, "test.ts");
    
    await Deno.writeTextFile(filePath, "export const Test = 'no metadata';");
    
    await assertRejects(
      () => producer.syncFile(filePath),
      Error,
      "No @codefactory metadata"
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Producer.syncFile - should error if factory not found", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    const producer = new Producer(registry);
    const filePath = join(tempDir, "test.ts");
    
    await Deno.writeTextFile(
      filePath,
      "/**\n * @codefactory nonexistent\n * name: Test\n */\n\nexport const Test = 'test';"
    );
    
    await assertRejects(
      () => producer.syncFile(filePath),
      Error,
      'Factory "nonexistent" not found'
    );
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Producer.syncAll - should sync multiple files", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    registry.register({
        name: "test",
        description: "Test factory",
        params: {},
        generate: (params) => ({ content: `export const ${params.name} = 'test';` }),
      }
    );
    
    const producer = new Producer(registry);
    
    // Create multiple files with metadata
    await Deno.writeTextFile(
      join(tempDir, "file1.ts"),
      "/**\n * @codefactory test\n * name: One\n */\n\nexport const One = 'test';"
    );
    
    await Deno.writeTextFile(
      join(tempDir, "file2.ts"),
      "/**\n * @codefactory test\n * name: Two\n */\n\nexport const Two = 'test';"
    );
    
    const result = await producer.syncAll(tempDir);
    
    assertEquals(result.success, true);
    assertEquals(result.generated.length, 2);
    assertEquals(result.errors.length, 0);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Producer.syncAll - should handle errors", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    const producer = new Producer(registry);
    
    // Create file with nonexistent factory
    await Deno.writeTextFile(
      join(tempDir, "bad.ts"),
      "/**\n * @codefactory nonexistent\n * name: Bad\n */\n\nexport const Bad = 'test';"
    );
    
    const result = await producer.syncAll(tempDir);
    
    assertEquals(result.success, false);
    assertEquals(result.generated.length, 0);
    assertEquals(result.errors.length, 1);
    assertStringIncludes(result.errors[0].error, "not found");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Producer.syncAll - should scan subdirectories", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    registry.register({
        name: "test",
        description: "Test factory",
        params: {},
        generate: (params) => ({ content: `export const ${params.name} = 'test';` }),
      }
    );
    
    const producer = new Producer(registry);
    
    // Create nested directory structure
    await Deno.mkdir(join(tempDir, "subdir"), { recursive: true });
    
    await Deno.writeTextFile(
      join(tempDir, "root.ts"),
      "/**\n * @codefactory test\n * name: Root\n */\n\nexport const Root = 'test';"
    );
    
    await Deno.writeTextFile(
      join(tempDir, "subdir", "nested.ts"),
      "/**\n * @codefactory test\n * name: Nested\n */\n\nexport const Nested = 'test';"
    );
    
    const result = await producer.syncAll(tempDir);
    
    assertEquals(result.success, true);
    assertEquals(result.generated.length, 2);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Producer.syncAll - should skip files without metadata", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    registry.register({
        name: "test",
        description: "Test factory",
        params: {},
        generate: (params) => ({ content: `export const ${params.name} = 'test';` }),
      }
    );
    
    const producer = new Producer(registry);
    
    await Deno.writeTextFile(
      join(tempDir, "with.ts"),
      "/**\n * @codefactory test\n * name: With\n */\n\nexport const With = 'test';"
    );
    
    await Deno.writeTextFile(
      join(tempDir, "without.ts"),
      "export const Without = 'no metadata';"
    );
    
    const result = await producer.syncAll(tempDir);
    
    assertEquals(result.success, true);
    assertEquals(result.generated.length, 1);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Producer.syncAll - should skip non-source files", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    const producer = new Producer(registry);
    
    // Create a text file with @codefactory (should be ignored)
    await Deno.writeTextFile(
      join(tempDir, "readme.txt"),
      "This has @codefactory but is not a source file"
    );
    
    const result = await producer.syncAll(tempDir);
    
    assertEquals(result.generated.length, 0);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
