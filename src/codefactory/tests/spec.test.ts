/**
 * Tests for spec field in factories and generated code
 */

import { assertEquals, assertExists } from "@std/assert";
import { TemplateLoader } from "../template-loader.ts";
import { extractMetadata, generateMetadata, generateFile } from "../metadata.ts";
import { FactoryRegistry } from "../registry.ts";
import { Producer } from "../producer.ts";
import { join } from "@std/path";

// ============================================================================
// Factory-level spec tests
// ============================================================================

Deno.test("TemplateLoader - loads spec field from factory frontmatter (string)", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const factoryPath = join(tempDir, "test.codefactory");
    await Deno.writeTextFile(
      factoryPath,
      `name: test_factory
description: Test factory with inline spec
spec: This is a simple inline specification
params:
  name:
    type: string
    required: true
    
template: |
  export const {{name}} = 'test';
`
    );
    
    const { frontmatter } = await TemplateLoader.loadTemplate(factoryPath);
    
    assertEquals(frontmatter.spec, "This is a simple inline specification");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("TemplateLoader - loads spec field with references (object)", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const factoryPath = join(tempDir, "test.codefactory");
    await Deno.writeTextFile(
      factoryPath,
      `name: test_factory
description: Test factory with structured spec
spec:
  description: Detailed specification
  files:
    - path: specs/component.md
      description: Component spec
  references:
    - url: https://example.com/spec
      title: External Spec
  aiGuidance: Follow the spec carefully
params:
  name:
    type: string
    required: true
    
template: |
  export const {{name}} = 'test';
`
    );
    
    const { frontmatter } = await TemplateLoader.loadTemplate(factoryPath);
    
    assertExists(frontmatter.spec);
    const spec = frontmatter.spec as Record<string, unknown>;
    assertEquals(spec.description, "Detailed specification");
    assertExists(spec.files);
    assertExists(spec.references);
    assertEquals(spec.aiGuidance, "Follow the spec carefully");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("TemplateLoader - toFactoryDefinition includes spec field", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const factoryPath = join(tempDir, "test.codefactory");
    await Deno.writeTextFile(
      factoryPath,
      `name: test_factory
description: Test factory
spec: Test specification
params:
  name:
    type: string
    required: true
    
template: |
  export const {{name}} = 'test';
`
    );
    
    const definition = await TemplateLoader.loadFactory(factoryPath);
    
    assertEquals(definition.spec, "Test specification");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Factory.getMetadata - includes spec field", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    const testFactoryPath = join(tempDir, "test.codefactory");
    await Deno.writeTextFile(
      testFactoryPath,
      `name: test_factory
description: Test factory
spec: Test specification
params:
  name:
    type: string
    required: true
    
template: |
  export const {{name}} = 'test';
`
    );
    
    // Load factory manually
    const definition = await TemplateLoader.loadFactory(testFactoryPath);
    registry.register(definition);
    
    const factory = registry.get("test_factory");
    assertExists(factory);
    
    const metadata = factory.getMetadata();
    assertEquals(metadata.spec, "Test specification");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// ============================================================================
// Generated code spec tests
// ============================================================================

Deno.test("generateMetadata - includes spec field in JSDoc", () => {
  const metadata = generateMetadata(
    "test_factory",
    { name: "Button" },
    "https://example.com/specs/button.md"
  );
  
  assertEquals(metadata.includes("@codefactory test_factory"), true);
  assertEquals(metadata.includes("spec: https://example.com/specs/button.md"), true);
  assertEquals(metadata.includes("name: Button"), true);
});

Deno.test("generateMetadata - works without spec field", () => {
  const metadata = generateMetadata(
    "test_factory",
    { name: "Button" }
  );
  
  assertEquals(metadata.includes("@codefactory test_factory"), true);
  assertEquals(metadata.includes("spec:"), false);
  assertEquals(metadata.includes("name: Button"), true);
});

Deno.test("generateFile - includes spec in metadata", () => {
  const file = generateFile(
    "test_factory",
    { name: "Button" },
    "export const Button = 'test';",
    "specs/button.md"
  );
  
  assertEquals(file.includes("@codefactory test_factory"), true);
  assertEquals(file.includes("spec: specs/button.md"), true);
  assertEquals(file.includes("name: Button"), true);
  assertEquals(file.includes("export const Button = 'test';"), true);
});

Deno.test("extractMetadata - extracts spec field from YAML format", () => {
  const source = `
/**
 * @codefactory test_factory
 * spec: https://example.com/specs/button.md
 * name: Button
 * variant: primary
 */
export const Button = 'test';
  `;
  
  const metadata = extractMetadata(source);
  
  assertExists(metadata);
  assertEquals(metadata.factoryName, "test_factory");
  assertEquals(metadata.spec, "https://example.com/specs/button.md");
  assertEquals(metadata.params.name, "Button");
  assertEquals(metadata.params.variant, "primary");
});

Deno.test("extractMetadata - works without spec field", () => {
  const source = `
/**
 * @codefactory test_factory
 * name: Button
 */
export const Button = 'test';
  `;
  
  const metadata = extractMetadata(source);
  
  assertExists(metadata);
  assertEquals(metadata.factoryName, "test_factory");
  assertEquals(metadata.spec, undefined);
  assertEquals(metadata.params.name, "Button");
});

Deno.test("extractMetadata - extracts spec from JSON format", () => {
  const source = `
/** @codefactory test_factory {"spec":"https://example.com/spec","name":"Button"} */
export const Button = 'test';
  `;
  
  const metadata = extractMetadata(source);
  
  assertExists(metadata);
  assertEquals(metadata.factoryName, "test_factory");
  assertEquals(metadata.spec, "https://example.com/spec");
  assertEquals(metadata.params.name, "Button");
});

// ============================================================================
// Producer integration tests
// ============================================================================

Deno.test("Producer.createFile - includes spec from params", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    registry.register({
      name: "test_factory",
      description: "Test factory",
      params: {},
      generate: (params) => ({
        content: `export const ${params.name} = 'test';`
      })
    });
    
    const producer = new Producer(registry);
    const outputPath = join(tempDir, "test.ts");
    
    await producer.createFile(
      "test_factory",
      {
        name: "Button",
        spec: "https://example.com/specs/button.md"
      },
      outputPath
    );
    
    const content = await Deno.readTextFile(outputPath);
    
    assertEquals(content.includes("@codefactory test_factory"), true);
    assertEquals(content.includes("spec: https://example.com/specs/button.md"), true);
    assertEquals(content.includes("name: Button"), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Producer.syncFile - preserves spec field", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    registry.register({
      name: "test_factory",
      description: "Test factory",
      params: {},
      generate: (params) => ({
        content: `export const ${params.name} = 'updated';`
      })
    });
    
    const producer = new Producer(registry);
    const filePath = join(tempDir, "test.ts");
    
    // Create initial file with spec
    await Deno.writeTextFile(
      filePath,
      `/**
 * @codefactory test_factory
 * spec: https://example.com/specs/button.md
 * name: Button
 */
export const Button = 'test';
`
    );
    
    // Sync the file
    await producer.syncFile(filePath);
    
    // Check that spec was preserved
    const content = await Deno.readTextFile(filePath);
    assertEquals(content.includes("spec: https://example.com/specs/button.md"), true);
    assertEquals(content.includes("name: Button"), true);
    assertEquals(content.includes("export const Button = 'updated';"), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// ============================================================================
// End-to-end test with button_component factory
// ============================================================================

Deno.test("E2E - button_component factory has spec field", async () => {
  const registry = new FactoryRegistry();
  
  // Load the test button_component factory from fixtures
  await registry.autoRegister(
    new URL("./fixtures/spec/", import.meta.url).href,
    { pattern: "button_component.codefactory" }
  );
  
  const factory = registry.get("button_component");
  assertExists(factory, "button_component factory should exist");
  
  const metadata = factory.getMetadata();
  assertExists(metadata.spec, "button_component should have spec field");
  
  // Check that spec has expected structure
  const spec = metadata.spec as Record<string, unknown>;
  assertExists(spec.description);
  assertExists(spec.references);
  assertExists(spec.aiGuidance);
});

Deno.test("E2E - button_component generates code with instance spec", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const registry = new FactoryRegistry();
    await registry.autoRegister(
      new URL("./fixtures/spec/", import.meta.url).href,
      { pattern: "button_component.codefactory" }
    );
    
    const producer = new Producer(registry);
    const outputPath = join(tempDir, "SubmitButton.ts");
    
    await producer.createFile(
      "button_component",
      {
        componentName: "SubmitButton",
        variant: "primary",
        spec: "https://myapp.com/specs/submit-button.md"
      },
      outputPath
    );
    
    const content = await Deno.readTextFile(outputPath);
    
    // Check factory name
    assertEquals(content.includes("@codefactory button_component"), true);
    
    // Check instance spec
    assertEquals(content.includes("spec: https://myapp.com/specs/submit-button.md"), true);
    
    // Check params
    assertEquals(content.includes("componentName: SubmitButton"), true);
    assertEquals(content.includes("variant: primary"), true);
    
    // Check generated code
    assertEquals(content.includes("export class SubmitButton"), true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
