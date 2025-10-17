/**
 * Proof of Concept: Automatic Extractor Generation from Templates
 * 
 * Demonstroi miten Handlebars-template voidaan automaattisesti analysoida
 * ja generoida extractorit jotka parsivat parametrit takaisin lähdekoodista.
 */

import { assertEquals } from "@std/assert";

// ============================================================================
// Core Types
// ============================================================================

interface ExtractorResult {
  [key: string]: string | number | boolean | Array<unknown> | Record<string, unknown>;
}

interface TemplateBlock {
  type: "param" | "loop";
  paramName?: string;
  paramType?: string;
  loopBody?: string;
  loopItemStructure?: Record<string, string>;
  template?: string;
}

// ============================================================================
// Template Analyzer - Analysoi Handlebars-templaatin rakenteen
// ============================================================================

/**
 * Analysoi Handlebars-template ja tunnistaa parametrit automaattisesti
 */
function analyzeTemplate(template: string): TemplateBlock[] {
  const blocks: TemplateBlock[] = [];
  const lines = template.split("\n");
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Check for {{#each}} loop
    const eachMatch = line.match(/\{\{#each\s+(\w+)\}\}/);
    if (eachMatch) {
      const paramName = eachMatch[1];
      const loopLines: string[] = [];
      i++;
      
      // Collect loop body until {{/each}}
      while (i < lines.length && !lines[i].includes("{{/each}}")) {
        loopLines.push(lines[i]);
        i++;
      }
      
      const loopBody = loopLines.join("\n").trim();
      
      // Detect item structure from {{this.field}} references
      const fieldMatches = [...loopBody.matchAll(/\{\{this\.(\w+)\}\}/g)];
      const itemStructure: Record<string, string> = {};
      
      if (fieldMatches.length > 0) {
        // Complex structure with fields (e.g., {{this.name}})
        fieldMatches.forEach((match) => {
          itemStructure[match[1]] = "string"; // Default to string
        });
      } else if (loopBody.includes("{{this}}")) {
        // Simple {{this}} reference - extract whole line
        itemStructure["_isSimple"] = "true";
      }
      
      blocks.push({
        type: "loop",
        paramName,
        loopBody,
        loopItemStructure: itemStructure,
      });
      
      i++;
      continue;
    }
    
    // Check for simple {{param}} (not in a loop)
    const paramMatches = [...line.matchAll(/\{\{(\w+)\}\}/g)];
    if (paramMatches.length > 0) {
      // Each unique param on this line gets its own block
      const seenParams = new Set<string>();
      for (const match of paramMatches) {
        const paramName = match[1];
        if (seenParams.has(paramName)) continue;
        seenParams.add(paramName);
        
        // Detect type from context
        let paramType = "identifier";
        if (line.includes("'") || line.includes('"')) {
          paramType = "string-literal";
        }
        
        blocks.push({
          type: "param",
          paramName,
          template: line.trim(),
          paramType,
        });
      }
    }
    
    i++;
  }
  
  return blocks;
}

// ============================================================================
// Extractor Generators - Generoivat regex-extractorit template-blokeista
// ============================================================================

/**
 * Generoi extractor-regex yksinkertaiselle parametrille
 */
function generateSimpleExtractor(
  template: string,
  paramName: string,
  paramType: string = "string"
): RegExp {
  const typePatterns: Record<string, string> = {
    string: "(\\w+)",
    number: "(\\d+)",
    boolean: "(true|false)",
    code: "([\\s\\S]+?)",
    identifier: "([a-zA-Z_$][a-zA-Z0-9_$]*)",
    "string-literal": "([^'\"]+)",
  };

  const capturePattern = typePatterns[paramType] || typePatterns.string;
  let pattern = template;
  
  const marker = "___CAPTURE_GROUP___";
  pattern = pattern.replace(new RegExp(`\\{\\{${paramName}\\}\\}`, "g"), marker);
  pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  pattern = pattern.replace(marker, capturePattern);
  pattern = pattern.replace(/\\\{\\\{[^}]+\\\}\\\}/g, "\\w+");
  pattern = pattern.replace(/\\s\+/g, "\\s+");

  return new RegExp(pattern);
}

/**
 * Generoi loop-extractor {{#each}} -blokeille
 */
function generateLoopExtractor(
  loopBody: string,
  itemStructure: Record<string, string>
): { pattern: RegExp; fields: string[] } {
  let pattern = loopBody;
  const fields = Object.keys(itemStructure);
  const markers: string[] = [];

  fields.forEach((field, i) => {
    const marker = `___CAPTURE_${i}___`;
    markers.push(marker);
    pattern = pattern.replace(new RegExp(`\\{\\{this\\.${field}\\}\\}`, "g"), marker);
  });

  pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  fields.forEach((field, i) => {
    const fieldType = itemStructure[field];
    const capturePattern = fieldType === "number" ? "(\\d+)" : "([^;,)\\s]+)";
    pattern = pattern.replace(markers[i], capturePattern);
  });

  pattern = pattern.replace(/\\\s\*/g, "\\s*");

  return {
    pattern: new RegExp(pattern, "gm"),
    fields,
  };
}

/**
 * Extract loop-parametrit lähdekoodista
 */
function extractLoopParams(
  source: string,
  loopBody: string,
  itemStructure: Record<string, string>
): Array<Record<string, string>> {
  const { pattern, fields } = generateLoopExtractor(loopBody, itemStructure);
  const results: Array<Record<string, string>> = [];

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    const item: Record<string, string> = {};
    fields.forEach((field, i) => {
      item[field] = match![i + 1].trim();
    });
    results.push(item);
  }

  return results;
}

/**
 * Generoi extractorit kaikille template-blokeille
 */
function generateExtractors(blocks: TemplateBlock[]) {
  return blocks.map((block) => {
    if (block.type === "param" && block.template && block.paramName) {
      return {
        paramName: block.paramName,
        extractor: (source: string) => {
          const regex = generateSimpleExtractor(
            block.template!,
            block.paramName!,
            block.paramType || "identifier"
          );
          const match = source.match(regex);
          return match?.[1] || null;
        },
      };
    }
    
    if (block.type === "loop" && block.loopBody && block.loopItemStructure) {
      return {
        paramName: block.paramName!,
        extractor: (source: string) => {
          // Check if this is a simple {{this}} loop (like props)
          if (block.loopItemStructure!["_isSimple"]) {
            // Extract lines from interface block
            const interfaceMatch = source.match(/interface\s+\w+Props\s*\{([^}]+)\}/s);
            if (interfaceMatch) {
              const propsBlock = interfaceMatch[1];
              const lines = propsBlock
                .split("\n")
                .map(line => line.trim())
                .filter(line => line && !line.includes("{") && !line.includes("}"))
                .map(line => line.endsWith(";") ? line.slice(0, -1) : line);
              return lines;
            }
            return [];
          }
          
          // Complex structure with fields
          return extractLoopParams(source, block.loopBody!, block.loopItemStructure!);
        },
      };
    }
    
    return null;
  }).filter(Boolean);
}

// ============================================================================
// Main API
// ============================================================================

/**
 * 🎯 MAIN API - Extract kaikki parametrit lähdekoodista automaattisesti
 */
function extractAllParams(source: string, template: string): ExtractorResult {
  const blocks = analyzeTemplate(template);
  const extractors = generateExtractors(blocks);
  const result: ExtractorResult = {};
  const seen = new Set<string>();
  
  for (const extractor of extractors) {
    if (!extractor) continue;
    if (seen.has(extractor.paramName)) continue;
    seen.add(extractor.paramName);
    
    const value = extractor.extractor(source);
    if (value !== null) {
      result[extractor.paramName] = value;
    }
  }
  
  return result;
}

// ============================================================================
// TESTS - Demonstroi automaattisen extractoinnin toimintaa
// ============================================================================

Deno.test("POC: Fully automatic extraction from template", () => {
  // Koko web-component template
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

  // Käyttäjän generoitu/editoitu source
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

// Custom code added by user
export const PrimaryButton = styled(Button);
  `.trim();

  // ✨ MAGIA: Extract kaikki parametrit automaattisesti!
  const params = extractAllParams(source, template);

  console.log("\n✅ Fully automatic extraction!");
  console.log("Extracted params:", JSON.stringify(params, null, 2));

  // Verify extracted params
  assertEquals(params.componentName, "Button");
  assertEquals(params.tagName, "app-button");
  assertEquals(Array.isArray(params.props), true);
  assertEquals((params.props as Array<unknown>).length, 3);
  assertEquals(Array.isArray(params.signals), true);
  assertEquals((params.signals as Array<unknown>).length, 3);
  
  const signals = params.signals as Array<Record<string, string>>;
  assertEquals(signals[0].name, "count");
  assertEquals(signals[1].name, "isOpen");
  assertEquals(signals[2].name, "total");
  
  const props = params.props as Array<string>;
  assertEquals(props[0], "label: string");
  assertEquals(props[1], "onClick?: () => void");
  assertEquals(props[2], "disabled: boolean");
});

Deno.test("POC: Automatic extraction detects user changes", () => {
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

  // Original generation
  const originalSource = `
class Counter extends HTMLProps(HTMLElement)<CounterProps>() {
  count = signal<number>(0);

  render() {
   return new html.Div({ content: this.count() });
  }
}

Counter.define('app-counter');
  `.trim();

  // User modifications
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

  // Extract from both
  const originalParams = extractAllParams(originalSource, template);
  const modifiedParams = extractAllParams(modifiedSource, template);

  console.log("\n✅ Change detection:");
  console.log("Original signals:", (originalParams.signals as Array<unknown>).length);
  console.log("Modified signals:", (modifiedParams.signals as Array<unknown>).length);
  console.log("Original tagName:", originalParams.tagName);
  console.log("Modified tagName:", modifiedParams.tagName);

  // Verify changes detected
  assertEquals((originalParams.signals as Array<unknown>).length, 1);
  assertEquals((modifiedParams.signals as Array<unknown>).length, 3);
  assertEquals(originalParams.tagName, "app-counter");
  assertEquals(modifiedParams.tagName, "my-counter");
  
  const modifiedSignals = modifiedParams.signals as Array<Record<string, string>>;
  assertEquals(modifiedSignals[0].name, "count");
  assertEquals(modifiedSignals[1].name, "step");
  assertEquals(modifiedSignals[2].name, "max");
});
