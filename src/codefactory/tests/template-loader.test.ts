/**
 * Tests for template loader
 */

import { assertEquals, assertRejects } from "@std/assert";
import { TemplateLoader } from "../template-loader.ts";
import { dirname, fromFileUrl, join } from "@std/path";
import Handlebars from "handlebars";

const __dirname = dirname(fromFileUrl(import.meta.url));
const fixturesDir = join(__dirname, "fixtures");

Deno.test("TemplateLoader.loadTemplate - YAML format", async () => {
  const templatePath = join(fixturesDir, "test-factory.codefactory");
  const { frontmatter, template } = await TemplateLoader.loadTemplate(templatePath);

  assertEquals(frontmatter.name, "test_factory");
  assertEquals(frontmatter.description, "A test factory for unit tests");
  assertEquals(frontmatter.params?.name?.type, "string");
  assertEquals(frontmatter.params?.name?.required, true);
  assertEquals(template.trim(), 'export const {{name}} = "{{value}}";');
});

Deno.test("TemplateLoader.loadTemplate - with params and examples", async () => {
  const templatePath = join(fixturesDir, "json-factory.codefactory");
  const { frontmatter } = await TemplateLoader.loadTemplate(templatePath);

  assertEquals(frontmatter.name, "json_factory");
  assertEquals(frontmatter.description, "A factory with JSON frontmatter");
  assertEquals(frontmatter.params?.foo?.type, "string");
});

Deno.test("TemplateLoader.loadTemplate - with outputPath", async () => {
  const templatePath = join(fixturesDir, "output-path.codefactory");
  const { frontmatter } = await TemplateLoader.loadTemplate(templatePath);

  assertEquals(frontmatter.name, "factory_with_output");
  assertEquals(frontmatter.outputPath, "src/{{filename}}.ts");
});

Deno.test("TemplateLoader.loadTemplate - missing name throws error", async () => {
  const templatePath = join(fixturesDir, "no-frontmatter.codefactory");

  await assertRejects(
    () => TemplateLoader.loadTemplate(templatePath),
    Error,
    "missing required field: name"
  );
});

Deno.test("TemplateLoader.toFactoryDefinition - creates valid factory", async () => {
  const templatePath = join(fixturesDir, "test-factory.codefactory");
  const { frontmatter, template } = await TemplateLoader.loadTemplate(templatePath);

  const factory = TemplateLoader.toFactoryDefinition(frontmatter, template);

  assertEquals(factory.name, "test_factory");
  assertEquals(factory.description, "A test factory for unit tests");
  assertEquals(typeof factory.generate, "function");
});

Deno.test("TemplateLoader.toFactoryDefinition - generate() renders template", async () => {
  const templatePath = join(fixturesDir, "test-factory.codefactory");
  const { frontmatter, template } = await TemplateLoader.loadTemplate(templatePath);

  const factory = TemplateLoader.toFactoryDefinition(frontmatter, template);
  const result = await factory.generate({ name: "myVar", value: "hello" });

  assertEquals(result.content.trim(), 'export const myVar = "hello";');
});

Deno.test("TemplateLoader.toFactoryDefinition - with outputPath", async () => {
  const templatePath = join(fixturesDir, "output-path.codefactory");
  const { frontmatter, template } = await TemplateLoader.loadTemplate(templatePath);

  const factory = TemplateLoader.toFactoryDefinition(frontmatter, template);
  const result = await factory.generate({ filename: "test" });

  assertEquals(result.content.trim(), "// Generated file: test");
  assertEquals(result.filePath, "src/test.ts");
});

Deno.test("Handlebars template rendering - basic substitution", () => {
  const template = "Hello {{name}}, you are {{age}} years old";
  const compiled = Handlebars.compile(template);
  const result = compiled({
    name: "Alice",
    age: 30,
  });

  assertEquals(result, "Hello Alice, you are 30 years old");
});

Deno.test("Handlebars template rendering - multiple occurrences", () => {
  const template = "{{x}} + {{x}} = {{result}}";
  const compiled = Handlebars.compile(template);
  const result = compiled({
    x: 5,
    result: 10,
  });

  assertEquals(result, "5 + 5 = 10");
});

Deno.test("TemplateLoader.loadDirectory - loads all .codefactory templates", async () => {
  const factories = await TemplateLoader.loadDirectory(fixturesDir);

  // Should load test-factory.codefactory, json-factory.codefactory, output-path.codefactory
  // Should NOT load no-frontmatter.codefactory (missing required fields)
  assertEquals(factories.length >= 3, true);
  
  const factoryNames = factories.map(f => f.name);
  assertEquals(factoryNames.includes("test_factory"), true);
  assertEquals(factoryNames.includes("json_factory"), true);
  assertEquals(factoryNames.includes("factory_with_output"), true);
});

Deno.test("TemplateLoader.loadDirectory - filters by extension", async () => {
  const factories = await TemplateLoader.loadDirectory(fixturesDir, {
    extensions: [".codefactory"],
  });

  // Should load all .codefactory files
  assertEquals(factories.length >= 3, true);
});

Deno.test("TemplateLoader.loadDirectory - non-existent directory returns empty", async () => {
  const factories = await TemplateLoader.loadDirectory("/non/existent/path");
  assertEquals(factories, []);
});

Deno.test("TemplateLoader.loadFactory - convenience method", async () => {
  const templatePath = join(fixturesDir, "test-factory.codefactory");
  const factory = await TemplateLoader.loadFactory(templatePath);

  assertEquals(factory.name, "test_factory");
  assertEquals(typeof factory.generate, "function");

  const result = await factory.generate({ name: "test", value: "123" });
  assertEquals(result.content.trim(), 'export const test = "123";');
});

Deno.test("Handlebars template - no HTML encoding for code", async () => {
  const frontmatter = {
    name: "arrow_function_test",
    description: "Test that arrow functions are not HTML encoded",
  };
  
  const template = "const fn = {{signature}};";
  const factory = TemplateLoader.toFactoryDefinition(frontmatter, template);
  
  // Test arrow function syntax
  const result1 = await factory.generate({ signature: "() => void" });
  assertEquals(result1.content, "const fn = () => void;");
  assertEquals(result1.content.includes("&#x3D;&gt;"), false, "Should not contain HTML entities");
  
  // Test comparison operators
  const result2 = await factory.generate({ signature: "x <= y && y >= z" });
  assertEquals(result2.content, "const fn = x <= y && y >= z;");
  assertEquals(result2.content.includes("&lt;"), false, "Should not encode <");
  assertEquals(result2.content.includes("&gt;"), false, "Should not encode >");
  
  // Test JSX/HTML in code
  const result3 = await factory.generate({ signature: "<div>Hello</div>" });
  assertEquals(result3.content, "const fn = <div>Hello</div>;");
  assertEquals(result3.content.includes("&lt;"), false, "Should not encode < in JSX");
});
