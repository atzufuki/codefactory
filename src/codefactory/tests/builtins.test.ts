/**
 * Integration test for define_factory meta-factory
 */

import { assertEquals } from "@std/assert";
import { defineFactoryFactory } from "../builtins.ts";

Deno.test("defineFactoryFactory - has correct metadata from frontmatter", () => {
  assertEquals(defineFactoryFactory.name, "define_factory");
  assertEquals(
    defineFactoryFactory.description,
    "Creates a new template-based factory definition. This meta-factory allows you to define factories using simple templates with {{variable}} placeholders."
  );
  
  // Check params are loaded
  assertEquals(defineFactoryFactory.params.name?.required, true);
  assertEquals(defineFactoryFactory.params.description?.required, true);
  assertEquals(defineFactoryFactory.params.template?.required, true);
  assertEquals(defineFactoryFactory.params.outputPath?.required, false);
  
  // Check examples are loaded
  assertEquals((defineFactoryFactory.examples?.length ?? 0) >= 2, true);
});

Deno.test("defineFactoryFactory - generates factory code", async () => {
  const result = await defineFactoryFactory.generate({
    name: "test_function",
    description: "A test function factory",
    template: "export function {{name}}() { return {{value}}; }",
    outputPath: "src/{{name}}.ts",
    paramDescriptions: {
      name: "Function name",
      value: "Return value",
    },
  });

  // Check output
  assertEquals(typeof result.content, "string");
  assertEquals(result.content.includes("test_function"), true);
  assertEquals(result.content.includes("A test function factory"), true);
  assertEquals(result.content.includes("defineFactory"), true);
  assertEquals(result.filePath, "factories/test_function.ts");
});

Deno.test("defineFactoryFactory - generates factory with PascalCase name", async () => {
  const result = await defineFactoryFactory.generate({
    name: "my_cool_factory",
    description: "Test",
    template: "test",
  });

  // Should generate: MyCoolFactoryFactory
  assertEquals(result.content.includes("MyCoolFactoryFactory"), true);
});

Deno.test("defineFactoryFactory - handles factory without outputPath", async () => {
  const result = await defineFactoryFactory.generate({
    name: "simple_factory",
    description: "Simple test",
    template: "{{code}}",
  });

  // Should not include outputPath line
  assertEquals(result.content.includes('outputPath:'), false);
  assertEquals(result.content.includes("simple_factory"), true);
});

Deno.test("defineFactoryFactory - handles factory without params", async () => {
  const result = await defineFactoryFactory.generate({
    name: "no_params_factory",
    description: "No params",
    template: "static content",
  });

  // Should not include params block
  assertEquals(result.content.includes('params: {'), false);
  assertEquals(result.content.includes("no_params_factory"), true);
});
