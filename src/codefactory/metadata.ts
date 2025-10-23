/**
 * Metadata-based parameter storage
 * 
 * This module handles JSDoc-style metadata blocks for factory parameters.
 * Replaces the complex regex-based extraction system with simple YAML/JSON parsing.
 * 
 * Format:
 * ```
 * /**
 *  * @codefactory <factory_name>
 *  * param1: value1
 *  * param2: value2
 *  * /
 * ```
 * 
 * @module metadata
 */

import { parse as parseYAML, stringify as stringifyYAML } from "@std/yaml";

// ============================================================================
// Types
// ============================================================================

/**
 * Extracted metadata block from source file
 */
export interface MetadataBlock {
  factoryName: string;
  params: Record<string, unknown>;
  spec?: string; // Instance-specific spec (URL or file path)
  startLine: number;
  endLine: number;
}

// ============================================================================
// Extraction
// ============================================================================

/**
 * Extract metadata from source file
 * 
 * Supports two formats:
 * 1. JSDoc YAML (recommended):
 *    /**
 *     * @codefactory factory_name
 *     * param: value
 *     * /
 * 
 * 2. JSDoc JSON (compact):
 *    /** @codefactory factory_name {"param":"value"} * /
 * 
 * @param source - Source file content
 * @returns Metadata block or null if not found
 */
export function extractMetadata(source: string): MetadataBlock | null {
  // Find JSDoc block with @codefactory
  const jsdocRegex = /\/\*\*\s*([\s\S]*?)\s*\*\//;
  const match = source.match(jsdocRegex);
  
  if (!match) {
    return null;
  }
  
  const blockContent = match[1];
  const blockStart = match.index!;
  const blockEnd = blockStart + match[0].length;
  
  // Check if it contains @codefactory
  if (!blockContent.includes('@codefactory')) {
    return null;
  }
  
  // Extract lines from JSDoc block
  const lines = blockContent
    .split('\n')
    .map(line => line.trim())
    .map(line => line.replace(/^\*\s?/, '')); // Remove leading " * "
  
  // Find @codefactory line
  const codefactoryLine = lines.find(line => line.startsWith('@codefactory'));
  if (!codefactoryLine) {
    return null;
  }
  
  // Extract factory name and check for JSON
  const parts = codefactoryLine.substring('@codefactory'.length).trim().split(/\s+/);
  const factoryName = parts[0];
  
  if (!factoryName) {
    throw new Error('Factory name missing from @codefactory directive');
  }
  
  // Check if it's JSON format (single line with object)
  const jsonMatch = codefactoryLine.match(/@codefactory\s+\w+\s+(\{.*\})/);
  if (jsonMatch) {
    // JSON format
    try {
      const parsed = JSON.parse(jsonMatch[1]) as Record<string, unknown>;
      
      // Extract spec field separately if present
      const spec = typeof parsed.spec === 'string' ? parsed.spec : undefined;
      
      // Remove spec from params (it's metadata, not a generation param)
      const { spec: _spec, ...params } = parsed;
      
      return {
        factoryName,
        params,
        spec,
        startLine: blockStart,
        endLine: blockEnd,
      };
    } catch (error) {
      throw new Error(
        `Invalid JSON in @codefactory metadata: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  // YAML format - collect param lines after @codefactory line
  const codefactoryIndex = lines.indexOf(codefactoryLine);
  const paramLines = lines.slice(codefactoryIndex + 1).filter(line => line.length > 0);
  
  if (paramLines.length === 0) {
    // No params
    return {
      factoryName,
      params: {},
      startLine: blockStart,
      endLine: blockEnd,
    };
  }
  
  // Parse as YAML
  const yamlContent = paramLines.join('\n');
  
  try {
    const parsed = parseYAML(yamlContent) as Record<string, unknown>;
    
    // Extract spec field separately if present
    const spec = typeof parsed.spec === 'string' ? parsed.spec : undefined;
    
    // Remove spec from params (it's metadata, not a generation param)
    const { spec: _spec, ...params } = parsed;
    
    return {
      factoryName,
      params: params || {},
      spec,
      startLine: blockStart,
      endLine: blockEnd,
    };
  } catch (error) {
    throw new Error(
      `Invalid YAML in @codefactory metadata: ${error instanceof Error ? error.message : String(error)}\n` +
      `Content:\n${yamlContent}`
    );
  }
}

// ============================================================================
// Generation
// ============================================================================

/**
 * Generate JSDoc metadata block
 * 
 * Creates a JSDoc comment block with factory name and parameters in YAML format.
 * 
 * @param factoryName - Name of the factory
 * @param params - Parameters object
 * @returns Formatted JSDoc block
 * 
 * @example
 * ```typescript
 * const block = generateMetadata("web_component", {
 *   componentName: "Button",
 *   props: ["label: string"]
 * });
 * // Returns:
 * // /**
 * //  * @codefactory web_component
 * //  * componentName: Button
 * //  * props:
 * //  *   - label: string
 * //  * /
 * ```
 */
export function generateMetadata(
  factoryName: string,
  params: Record<string, unknown>,
  spec?: string
): string {
  const lines = [`/**`, ` * @codefactory ${factoryName}`];
  
  // Add spec field first if present (before other params)
  if (spec) {
    lines.push(` * spec: ${spec}`);
  }
  
  // Convert params to YAML if there are any
  if (Object.keys(params).length > 0) {
    const yaml = stringifyYAML(params, {
      indent: 2,
      lineWidth: -1, // No line wrapping
      skipInvalid: true,
    });
    
    // Prefix each YAML line with " * "
    const yamlLines = yaml.trim().split('\n');
    for (const line of yamlLines) {
      lines.push(` * ${line}`);
    }
  }
  
  lines.push(` */`);
  
  return lines.join('\n');
}

/**
 * Generate complete file with metadata + code
 * 
 * Combines metadata block and generated code into a complete file.
 * 
 * @param factoryName - Name of the factory
 * @param params - Parameters object
 * @param generatedCode - Code generated by factory
 * @returns Complete file content
 * 
 * @example
 * ```typescript
 * const file = generateFile("web_component", 
 *   { componentName: "Button" },
 *   "export class Button { }"
 * );
 * ```
 */
export function generateFile(
  factoryName: string,
  params: Record<string, unknown>,
  generatedCode: string,
  spec?: string
): string {
  const metadata = generateMetadata(factoryName, params, spec);
  
  // Ensure code doesn't have leading newlines
  const code = generatedCode.trim();
  
  return `${metadata}\n\n${code}\n`;
}

/**
 * Update metadata in existing source file
 * 
 * Replaces the metadata block while preserving the rest of the file.
 * Note: In the new system, entire files are regenerated, so this is mainly
 * for testing or special cases.
 * 
 * @param source - Original source file content
 * @param params - New parameters
 * @returns Updated source file content
 */
export function updateMetadata(
  source: string,
  params: Record<string, unknown>,
  spec?: string
): string {
  const metadata = extractMetadata(source);
  
  if (!metadata) {
    throw new Error('No @codefactory metadata found in source file');
  }
  
  // Generate new metadata block (preserve existing spec if not provided)
  const newMetadataBlock = generateMetadata(
    metadata.factoryName,
    params,
    spec !== undefined ? spec : metadata.spec
  );
  
  // Replace old metadata block with new one
  const before = source.substring(0, metadata.startLine);
  const after = source.substring(metadata.endLine);
  
  return before + newMetadataBlock + after;
}
