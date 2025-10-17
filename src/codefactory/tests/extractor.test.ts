/**
 * Tests for automatic parameter extraction from source code
 */

import { assertEquals } from "@std/assert";
import {
  analyzeTemplate,
  extractAllParams,
  generateExtractors,
  generateLoopExtractor,
  generateSimpleExtractor,
  type TemplateBlock,
} from "../extractor.ts";

Deno.test("analyzeTemplate - detects simple parameters", () => {
  const template = "class {{componentName}} extends Base";
  const blocks = analyzeTemplate(template);
  
  assertEquals(blocks.length, 1);
  assertEquals(blocks[0].type, "param");
  assertEquals(blocks[0].paramName, "componentName");
});

Deno.test("analyzeTemplate - detects loop blocks", () => {
  const template = `
{{#each signals}}
  {{this.name}} = signal<{{this.type}}>({{this.default}});
{{/each}}
  `.trim();
  
  const blocks = analyzeTemplate(template);
  
  assertEquals(blocks.length, 1);
  assertEquals(blocks[0].type, "loop");
  assertEquals(blocks[0].paramName, "signals");
  assertEquals(typeof blocks[0].loopItemStructure, "object");
});

Deno.test("analyzeTemplate - detects simple {{this}} loops", () => {
  const template = `
{{#each props}}
  {{this}};
{{/each}}
  `.trim();
  
  const blocks = analyzeTemplate(template);
  
  assertEquals(blocks.length, 1);
  assertEquals(blocks[0].type, "loop");
  assertEquals(blocks[0].loopItemStructure!["_isSimple"], "true");
});

Deno.test("generateSimpleExtractor - creates working regex", () => {
  const template = "class {{name}} extends Base";
  const regex = generateSimpleExtractor(template, "name", "identifier");
  
  const source = "class Button extends Base";
  const match = source.match(regex);
  
  assertEquals(match?.[1], "Button");
});

Deno.test("generateLoopExtractor - creates working regex for complex structure", () => {
  const loopBody = "{{this.name}} = signal<{{this.type}}>({{this.default}});";
  const itemStructure = { name: "string", type: "string", default: "string" };
  
  const { pattern, fields } = generateLoopExtractor(loopBody, itemStructure);
  
  assertEquals(fields.length, 3);
  assertEquals(fields, ["name", "type", "default"]);
  
  const source = `
    count = signal<number>(0);
    isOpen = signal<boolean>(false);
  `;
  
  const matches = [...source.matchAll(pattern)];
  assertEquals(matches.length, 2);
  assertEquals(matches[0][1].trim(), "count");
  assertEquals(matches[0][2].trim(), "number");
  assertEquals(matches[0][3].trim(), "0");
});

Deno.test("extractAllParams - full web component extraction", () => {
  const template = `
import HTMLProps from '@html-props/core';
import { signal } from '@html-props/signals';
import * as html from '../html.ts';

interface {{componentName}}Props {
{{#each props}}
  {{this}};
{{/each}}
}

class {{componentName}} extends HTMLProps(HTMLElement)<{{componentName}}Props>() {
{{#each props}}
  {{this}};
{{/each}}

{{#each signals}}
  {{this.name}} = signal<{{this.type}}>({{this.default}});
{{/each}}

  render() {
   return {{content}};
  }
}

{{componentName}}.define('{{tagName}}');

export default {{componentName}};
  `.trim();

  const source = `
import HTMLProps from '@html-props/core';
import { signal } from '@html-props/signals';
import * as html from '../html.ts';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled: boolean;
}

class Button extends HTMLProps(HTMLElement)<ButtonProps>() {
  label: string;
  onClick?: () => void;
  disabled: boolean;

  count = signal<number>(0);
  isOpen = signal<boolean>(false);
  total = signal<number>(100);

  render() {
   return new html.Button({ content: this.label });
  }
}

Button.define('app-button');

export default Button;
  `.trim();

  const params = extractAllParams(source, template);

  // Verify extracted params
  assertEquals(params.componentName, "Button");
  assertEquals(params.tagName, "app-button");
  assertEquals(Array.isArray(params.props), true);
  assertEquals((params.props as Array<unknown>).length, 3);
  assertEquals(Array.isArray(params.signals), true);
  assertEquals((params.signals as Array<unknown>).length, 3);
  
  const signals = params.signals as Array<Record<string, string>>;
  assertEquals(signals[0].name, "count");
  assertEquals(signals[0].type, "number");
  assertEquals(signals[0].default, "0");
  assertEquals(signals[1].name, "isOpen");
  assertEquals(signals[2].name, "total");
  
  const props = params.props as Array<string>;
  assertEquals(props[0], "label: string");
  assertEquals(props[1], "onClick?: () => void");
  assertEquals(props[2], "disabled: boolean");
});

Deno.test("extractAllParams - detects user modifications", () => {
  const template = `
class {{componentName}} extends HTMLProps(HTMLElement)<{{componentName}}Props>() {
{{#each signals}}
  {{this.name}} = signal<{{this.type}}>({{this.default}});
{{/each}}

  render() {
   return {{content}};
  }
}

{{componentName}}.define('{{tagName}}');
  `.trim();

  const originalSource = `
class Counter extends HTMLProps(HTMLElement)<CounterProps>() {
  count = signal<number>(0);

  render() {
   return new html.Div({ content: this.count() });
  }
}

Counter.define('app-counter');
  `.trim();

  const modifiedSource = `
class Counter extends HTMLProps(HTMLElement)<CounterProps>() {
  count = signal<number>(0);
  step = signal<number>(1);
  max = signal<number>(100);

  render() {
   return new html.Div({ content: this.count() + this.step() });
  }
}

Counter.define('my-counter');
  `.trim();

  const originalParams = extractAllParams(originalSource, template);
  const modifiedParams = extractAllParams(modifiedSource, template);

  // Verify change detection
  assertEquals((originalParams.signals as Array<unknown>).length, 1);
  assertEquals((modifiedParams.signals as Array<unknown>).length, 3);
  assertEquals(originalParams.tagName, "app-counter");
  assertEquals(modifiedParams.tagName, "my-counter");
  
  const modifiedSignals = modifiedParams.signals as Array<Record<string, string>>;
  assertEquals(modifiedSignals[0].name, "count");
  assertEquals(modifiedSignals[1].name, "step");
  assertEquals(modifiedSignals[2].name, "max");
});

Deno.test("extractAllParams - handles empty source", () => {
  const template = "class {{componentName}} extends Base";
  const source = "";
  
  const params = extractAllParams(source, template);
  
  assertEquals(Object.keys(params).length, 0);
});

Deno.test("extractAllParams - handles malformed source", () => {
  const template = `
class {{componentName}} extends Base {
{{#each signals}}
  {{this.name}} = signal<{{this.type}}>({{this.default}});
{{/each}}
}
  `.trim();
  
  // Source missing signal declarations
  const source = `
class Button extends Base {
  // No signals here
}
  `.trim();
  
  const params = extractAllParams(source, template);
  
  assertEquals(params.componentName, "Button");
  assertEquals(Array.isArray(params.signals), true);
  assertEquals((params.signals as Array<unknown>).length, 0);
});

Deno.test("generateExtractors - skips invalid blocks", () => {
  const blocks: TemplateBlock[] = [
    { type: "param" }, // Invalid - no paramName
    { type: "loop" }, // Invalid - no loopBody
    { type: "param", paramName: "test", template: "{{test}}" }, // Valid
  ];
  
  const extractors = generateExtractors(blocks);
  
  assertEquals(extractors.length, 1);
  assertEquals(extractors[0]?.paramName, "test");
});

Deno.test("extractAllParams - handles duplicate param names", () => {
  const template = `
{{componentName}} extends Base
class {{componentName}} {
}
  `.trim();
  
  const source = `
Button extends Base
class Button {
}
  `.trim();
  
  const params = extractAllParams(source, template);
  
  // Should only extract once even though param appears twice
  assertEquals(params.componentName, "Button");
  assertEquals(Object.keys(params).length, 1);
});
