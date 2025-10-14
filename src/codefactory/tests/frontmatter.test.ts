/**
 * Tests for frontmatter parser
 */

import { assertEquals, assertThrows } from "@std/assert";
import { parseFrontmatter, hasFrontmatter, extractFrontmatter } from "../frontmatter.ts";

Deno.test("parseFrontmatter - YAML format", () => {
  const content = `---
name: test_factory
description: A test factory
params:
  foo:
    description: Foo parameter
    required: true
---
Template body here`;

  const result = parseFrontmatter<{
    name: string;
    description: string;
    params: Record<string, unknown>;
  }>(content);

  assertEquals(result.frontmatter.name, "test_factory");
  assertEquals(result.frontmatter.description, "A test factory");
  assertEquals(result.frontmatter.params.foo, {
    description: "Foo parameter",
    required: true,
  });
  assertEquals(result.body, "Template body here");
});

Deno.test("parseFrontmatter - JSON format", () => {
  const content = `/*---
{
  "name": "test_factory",
  "description": "A test factory",
  "params": {
    "foo": {
      "description": "Foo parameter",
      "required": true
    }
  }
}
---*/
Template body here`;

  const result = parseFrontmatter<{
    name: string;
    description: string;
    params: Record<string, unknown>;
  }>(content);

  assertEquals(result.frontmatter.name, "test_factory");
  assertEquals(result.frontmatter.description, "A test factory");
  assertEquals(result.frontmatter.params.foo, {
    description: "Foo parameter",
    required: true,
  });
  assertEquals(result.body, "Template body here");
});

Deno.test("parseFrontmatter - no frontmatter", () => {
  const content = "Just template content";

  const result = parseFrontmatter(content);

  assertEquals(result.frontmatter, {});
  assertEquals(result.body, content);
});

Deno.test("parseFrontmatter - YAML with CRLF line endings", () => {
  const content = "---\r\nname: test\r\n---\r\nBody";

  const result = parseFrontmatter<{ name: string }>(content);

  assertEquals(result.frontmatter.name, "test");
  assertEquals(result.body, "Body");
});

Deno.test("parseFrontmatter - JSON with CRLF line endings", () => {
  const content = '/*---\r\n{"name": "test"}\r\n---*/\r\nBody';

  const result = parseFrontmatter<{ name: string }>(content);

  assertEquals(result.frontmatter.name, "test");
  assertEquals(result.body, "Body");
});

Deno.test("parseFrontmatter - multiline YAML string", () => {
  const content = `---
name: test
template: |
  Line 1
  Line 2
  Line 3
---
Body`;

  const result = parseFrontmatter<{ name: string; template: string }>(content);

  assertEquals(result.frontmatter.name, "test");
  assertEquals(result.frontmatter.template, "Line 1\nLine 2\nLine 3\n");
  assertEquals(result.body, "Body");
});

Deno.test("parseFrontmatter - invalid YAML throws error", () => {
  const content = `---
name: test
invalid: [unclosed
---
Body`;

  assertThrows(
    () => parseFrontmatter(content),
    Error,
    "Failed to parse YAML frontmatter"
  );
});

Deno.test("parseFrontmatter - invalid JSON throws error", () => {
  const content = `/*---
{
  "name": "test",
  "invalid": [unclosed
}
---*/
Body`;

  assertThrows(
    () => parseFrontmatter(content),
    Error,
    "Failed to parse JSON frontmatter"
  );
});

Deno.test("hasFrontmatter - YAML format", () => {
  const content = "---\nname: test\n---\nBody";
  assertEquals(hasFrontmatter(content), true);
});

Deno.test("hasFrontmatter - JSON format", () => {
  const content = '/*---\n{"name": "test"}\n---*/\nBody';
  assertEquals(hasFrontmatter(content), true);
});

Deno.test("hasFrontmatter - no frontmatter", () => {
  const content = "Just content";
  assertEquals(hasFrontmatter(content), false);
});

Deno.test("extractFrontmatter - YAML format", () => {
  const content = "---\nname: test\ndescription: hello\n---\nBody";
  const extracted = extractFrontmatter(content);
  assertEquals(extracted, "name: test\ndescription: hello");
});

Deno.test("extractFrontmatter - JSON format", () => {
  const content = '/*---\n{"name": "test"}\n---*/\nBody';
  const extracted = extractFrontmatter(content);
  assertEquals(extracted, '{"name": "test"}');
});

Deno.test("extractFrontmatter - no frontmatter", () => {
  const content = "Just content";
  const extracted = extractFrontmatter(content);
  assertEquals(extracted, null);
});

Deno.test("parseFrontmatter - trims leading whitespace from body", () => {
  const content = `---
name: test
---

  Body with leading whitespace`;

  const result = parseFrontmatter<{ name: string }>(content);

  assertEquals(result.body, "Body with leading whitespace");
});

Deno.test("parseFrontmatter - complex nested YAML", () => {
  const content = `---
name: complex_factory
params:
  component:
    description: Component name
    required: true
  props:
    description: Component props
    required: false
examples:
  - name: example1
    params:
      component: Button
      props: ["label: string"]
  - name: example2
    params:
      component: Input
---
Body`;

  const result = parseFrontmatter<{
    name: string;
    params: Record<string, { description: string; required: boolean }>;
    examples: Array<{ name: string; params: Record<string, unknown> }>;
  }>(content);

  assertEquals(result.frontmatter.name, "complex_factory");
  assertEquals(result.frontmatter.params.component.required, true);
  assertEquals(result.frontmatter.examples.length, 2);
  assertEquals(result.frontmatter.examples[0].name, "example1");
});
