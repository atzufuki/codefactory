/**
 * Automatic Parameter Extraction from Source Code
 * 
 * This module provides functionality to extract parameters from generated source code
 * by analyzing the factory template. This enables the "code is the source of truth"
 * approach where parameters are stored in the generated code itself rather than in
 * a separate manifest file.
 * 
 * Key Features:
 * - Automatic template analysis
 * - Regex-based extractor generation
 * - Support for simple parameters and loops
 * - Bidirectional sync: Template ↔ Code
 * 
 * @module extractor
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Result of parameter extraction from source code
 */
export interface ExtractorResult {
  [key: string]: string | number | boolean | Array<unknown> | Record<string, unknown>;
}

/**
 * Represents a block in a Handlebars template (parameter or loop)
 */
export interface TemplateBlock {
  type: "param" | "loop";
  paramName?: string;
  paramType?: string;
  loopBody?: string;
  loopItemStructure?: Record<string, string>;
  template?: string;
}

/**
 * Generated extractor function for a parameter
 */
export interface ParameterExtractor {
  paramName: string;
  extractor: (source: string) => string | number | boolean | Array<unknown> | null;
}

// ============================================================================
// Template Analyzer - Analyzes Handlebars template structure
// ============================================================================

/**
 * Analyzes a Handlebars template and identifies parameters automatically
 * 
 * Detects:
 * - Simple parameters: {{paramName}}
 * - Loop blocks: {{#each arrayName}} ... {{/each}}
 * - Loop item structures: {{this.fieldName}}
 * 
 * @param template - Handlebars template string
 * @returns Array of identified template blocks
 * 
 * @example
 * ```typescript
 * const template = "class {{componentName}} { ... }";
 * const blocks = analyzeTemplate(template);
 * // => [{ type: "param", paramName: "componentName", ... }]
 * ```
 */
export function analyzeTemplate(template: string): TemplateBlock[] {
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
// Extractor Generators - Generate regex extractors from template blocks
// ============================================================================

/**
 * Generates a regex extractor for a simple template parameter
 * 
 * @param template - Template line containing the parameter
 * @param paramName - Name of the parameter to extract
 * @param paramType - Type hint for the parameter (affects regex pattern)
 * @returns Regular expression to extract the parameter value
 * 
 * @example
 * ```typescript
 * const regex = generateSimpleExtractor("class {{name}} extends Base", "name");
 * const match = "class Button extends Base".match(regex);
 * console.log(match[1]); // => "Button"
 * ```
 */
export function generateSimpleExtractor(
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
 * Generates a loop extractor for {{#each}} blocks
 * 
 * @param loopBody - The template content inside the {{#each}} block
 * @param itemStructure - Structure of loop items (field names and types)
 * @returns Object with regex pattern and field names
 * 
 * @example
 * ```typescript
 * const body = "{{this.name}} = signal<{{this.type}}>({{this.default}});";
 * const structure = { name: "string", type: "string", default: "string" };
 * const { pattern, fields } = generateLoopExtractor(body, structure);
 * ```
 */
export function generateLoopExtractor(
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
 * Extracts loop parameters from source code
 * 
 * @param source - Source code to extract from
 * @param loopBody - Template loop body
 * @param itemStructure - Structure of loop items
 * @returns Array of extracted items
 * 
 * @example
 * ```typescript
 * const source = `
 *   count = signal<number>(0);
 *   isOpen = signal<boolean>(false);
 * `;
 * const body = "{{this.name}} = signal<{{this.type}}>({{this.default}});";
 * const structure = { name: "string", type: "string", default: "string" };
 * const items = extractLoopParams(source, body, structure);
 * // => [
 * //   { name: "count", type: "number", default: "0" },
 * //   { name: "isOpen", type: "boolean", default: "false" }
 * // ]
 * ```
 */
export function extractLoopParams(
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
 * Generates extractor functions for all template blocks
 * 
 * @param blocks - Array of template blocks from analyzeTemplate()
 * @returns Array of parameter extractors
 * 
 * @example
 * ```typescript
 * const blocks = analyzeTemplate(template);
 * const extractors = generateExtractors(blocks);
 * const componentName = extractors[0].extractor(sourceCode);
 * ```
 */
export function generateExtractors(blocks: TemplateBlock[]): Array<ParameterExtractor | null> {
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
  }).filter(Boolean) as ParameterExtractor[];
}

// ============================================================================
// Main API
// ============================================================================

/**
 * 🎯 MAIN API - Extracts all parameters from source code automatically
 * 
 * This is the primary function for parameter extraction. It analyzes the template,
 * generates extractors, and extracts all parameter values from the source code.
 * 
 * @param source - Generated source code containing parameter values
 * @param template - Handlebars template used to generate the code
 * @returns Object mapping parameter names to their extracted values
 * 
 * @example
 * ```typescript
 * const template = `
 *   class {{componentName}} extends Base {
 *     {{#each signals}}
 *     {{this.name}} = signal<{{this.type}}>({{this.default}});
 *     {{/each}}
 *   }
 * `;
 * 
 * const source = `
 *   class Button extends Base {
 *     count = signal<number>(0);
 *     isOpen = signal<boolean>(false);
 *   }
 * `;
 * 
 * const params = extractAllParams(source, template);
 * // => {
 * //   componentName: "Button",
 * //   signals: [
 * //     { name: "count", type: "number", default: "0" },
 * //     { name: "isOpen", type: "boolean", default: "false" }
 * //   ]
 * // }
 * ```
 */
export function extractAllParams(source: string, template: string): ExtractorResult {
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
