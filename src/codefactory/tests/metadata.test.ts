/**
 * Tests for metadata parsing and generation
 */

import { assertEquals, assertThrows } from "@std/assert";
import {
  extractMetadata,
  generateFile,
  generateMetadata,
  updateMetadata,
} from "../metadata.ts";

// ============================================================================
// extractMetadata() tests
// ============================================================================

Deno.test("extractMetadata - parses JSDoc YAML params", () => {
  const source = `
/**
 * @codefactory test
 * name: Button
 * props:
 *   - "label: string"
 *   - "onClick: () => void"
 */
export class Button { }
  `;

  const metadata = extractMetadata(source);
  assertEquals(metadata?.factoryName, "test");
  assertEquals(metadata?.params.name, "Button");
  assertEquals(metadata?.params.props, ["label: string", "onClick: () => void"]);
});

Deno.test("extractMetadata - parses JSDoc JSON params", () => {
  const source = `
/** @codefactory test {"name":"Button","props":["label: string"]} */
export class Button { }
  `;

  const metadata = extractMetadata(source);
  assertEquals(metadata?.factoryName, "test");
  assertEquals(metadata?.params.name, "Button");
  assertEquals(metadata?.params.props, ["label: string"]);
});

Deno.test("extractMetadata - handles no params", () => {
  const source = `
/**
 * @codefactory simple
 */
export class Simple { }
  `;

  const metadata = extractMetadata(source);
  assertEquals(metadata?.factoryName, "simple");
  assertEquals(metadata?.params, {});
});

Deno.test("extractMetadata - handles complex nested YAML", () => {
  const source = `
/**
 * @codefactory web_component
 * componentName: Button
 * props:
 *   - "label: string"
 *   - "onClick: () => void"
 * signals:
 *   - name: count
 *     type: number
 *     default: 0
 *   - name: isOpen
 *     type: boolean
 *     default: false
 * tagName: app-button
 */
export class Button { }
  `;

  const metadata = extractMetadata(source);
  assertEquals(metadata?.factoryName, "web_component");
  assertEquals(metadata?.params.componentName, "Button");
  assertEquals(metadata?.params.tagName, "app-button");
  
  const props = metadata?.params.props as string[];
  assertEquals(props.length, 2);
  assertEquals(props[0], "label: string");
  
  const signals = metadata?.params.signals as Array<Record<string, unknown>>;
  assertEquals(signals.length, 2);
  assertEquals(signals[0].name, "count");
  assertEquals(signals[0].type, "number");
  assertEquals(signals[0].default, 0);
});

Deno.test("extractMetadata - returns null if no JSDoc", () => {
  const source = `
export class Button { }
  `;

  const metadata = extractMetadata(source);
  assertEquals(metadata, null);
});

Deno.test("extractMetadata - returns null if no @codefactory", () => {
  const source = `
/**
 * Regular JSDoc comment
 * @param name - The name
 */
export class Button { }
  `;

  const metadata = extractMetadata(source);
  assertEquals(metadata, null);
});

Deno.test("extractMetadata - throws on invalid YAML", () => {
  const source = `
/**
 * @codefactory test
 * invalid yaml:
 *   - missing
 *   closing bracket [
 */
export class Button { }
  `;

  assertThrows(
    () => extractMetadata(source),
    Error,
    "Invalid YAML"
  );
});

Deno.test("extractMetadata - throws on invalid JSON", () => {
  const source = `
/** @codefactory test {"invalid json} */
export class Button { }
  `;

  assertThrows(
    () => extractMetadata(source),
    Error,
    "Invalid JSON"
  );
});

Deno.test("extractMetadata - throws on missing factory name", () => {
  const source = `
/**
 * @codefactory
 * name: Button
 */
export class Button { }
  `;

  assertThrows(
    () => extractMetadata(source),
    Error,
    "Factory name missing"
  );
});

// ============================================================================
// generateMetadata() tests
// ============================================================================

Deno.test("generateMetadata - creates valid JSDoc YAML", () => {
  const block = generateMetadata("test", {
    name: "Button",
    props: ["label: string", "onClick: () => void"],
  });

  // Check structure
  assertEquals(block.startsWith("/**"), true);
  assertEquals(block.includes(" * @codefactory test"), true);
  assertEquals(block.includes(" * name: Button"), true);
  // YAML will quote strings with colons
  assertEquals(block.includes(" *   - 'label: string'") || block.includes(' *   - "label: string"'), true);
  assertEquals(block.includes(" */"), true);
});

Deno.test("generateMetadata - handles empty params", () => {
  const block = generateMetadata("simple", {});

  assertEquals(block, "/**\n * @codefactory simple\n */");
});

Deno.test("generateMetadata - handles nested objects", () => {
  const block = generateMetadata("web_component", {
    componentName: "Button",
    signals: [
      { name: "count", type: "number", default: 0 },
      { name: "isOpen", type: "boolean", default: false },
    ],
  });

  assertEquals(block.includes(" * @codefactory web_component"), true);
  assertEquals(block.includes(" * componentName: Button"), true);
  assertEquals(block.includes(" * signals:"), true);
  assertEquals(block.includes(" *   - name: count"), true);
  assertEquals(block.includes(" *     type: number"), true);
  assertEquals(block.includes(" *     default: 0"), true);
});

Deno.test("generateMetadata - handles string values with special chars", () => {
  const block = generateMetadata("test", {
    description: "A button with 'quotes' and \"double quotes\"",
    code: "const x = { key: 'value' };",
  });

  assertEquals(block.includes("@codefactory test"), true);
  assertEquals(block.includes("description:"), true);
  assertEquals(block.includes("code:"), true);
});

// ============================================================================
// generateFile() tests
// ============================================================================

Deno.test("generateFile - creates complete file with metadata", () => {
  const file = generateFile(
    "test",
    { name: "Button", count: 5 },
    "export class Button { }"
  );

  // Check metadata block
  assertEquals(file.includes("/**"), true);
  assertEquals(file.includes(" * @codefactory test"), true);
  assertEquals(file.includes(" * name: Button"), true);
  assertEquals(file.includes(" * count: 5"), true);
  assertEquals(file.includes(" */"), true);

  // Check code
  assertEquals(file.includes("export class Button { }"), true);

  // Check structure (metadata, blank line, code)
  const lines = file.trim().split("\n");
  assertEquals(lines[0], "/**");
  assertEquals(lines[lines.length - 1], "export class Button { }");
});

Deno.test("generateFile - trims code whitespace", () => {
  const file = generateFile(
    "test",
    {},
    "\n\n  export class Button { }  \n\n"
  );

  const lines = file.trim().split("\n");
  assertEquals(lines[lines.length - 1], "export class Button { }");
});

Deno.test("generateFile - works with empty params", () => {
  const file = generateFile(
    "simple",
    {},
    "export class Simple { }"
  );

  assertEquals(file.includes("/**\n * @codefactory simple\n */"), true);
  assertEquals(file.includes("export class Simple { }"), true);
});

// ============================================================================
// updateMetadata() tests
// ============================================================================

Deno.test("updateMetadata - replaces metadata block", () => {
  const source = `
/**
 * @codefactory test
 * name: Button
 * count: 0
 */
export class Button { 
  render() { return "Button"; }
}
  `.trim();

  const updated = updateMetadata(source, {
    name: "PrimaryButton",
    count: 10,
    variant: "primary",
  });

  // New metadata should be present
  assertEquals(updated.includes("name: PrimaryButton"), true);
  assertEquals(updated.includes("count: 10"), true);
  assertEquals(updated.includes("variant: primary"), true);

  // Old metadata should be gone
  assertEquals(updated.includes("name: Button"), false);
  assertEquals(updated.includes("count: 0"), false);

  // Code should be preserved
  assertEquals(updated.includes("export class Button {"), true);
  assertEquals(updated.includes('render() { return "Button"; }'), true);
});

Deno.test("updateMetadata - throws if no metadata found", () => {
  const source = `export class Button { }`;

  assertThrows(
    () => updateMetadata(source, { name: "Test" }),
    Error,
    "No @codefactory metadata found"
  );
});

// ============================================================================
// Round-trip tests
// ============================================================================

Deno.test("round-trip - generate and extract YAML", () => {
  const params = {
    componentName: "Button",
    tagName: "app-button",
    count: 5,
    signals: [
      { name: "count", type: "number", default: 0 },
    ],
  };

  const file = generateFile("web_component", params, "export class Button {}");
  const extracted = extractMetadata(file);

  assertEquals(extracted?.factoryName, "web_component");
  assertEquals(extracted?.params.componentName, params.componentName);
  assertEquals(extracted?.params.tagName, params.tagName);
  assertEquals(extracted?.params.count, params.count);
  
  const signals = extracted?.params.signals as Array<Record<string, unknown>>;
  assertEquals(signals.length, 1);
  assertEquals(signals[0].name, "count");
  assertEquals(signals[0].default, 0);
});

Deno.test("round-trip - update and extract", () => {
  const original = generateFile("test", { name: "Original" }, "class Test {}");
  const updated = updateMetadata(original, { name: "Updated", new: true });
  const extracted = extractMetadata(updated);

  assertEquals(extracted?.params.name, "Updated");
  assertEquals(extracted?.params.new, true);
});
