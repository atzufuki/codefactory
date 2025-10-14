/**
 * Frontmatter parser for template files
 * 
 * Supports both YAML and JSON frontmatter formats:
 * - YAML: ---\n...\n---
 * - JSON: /*---\n...\n---*\/
 */

import { parse as parseYAML } from "@std/yaml";

export interface ParseResult<T = unknown> {
  frontmatter: T;
  body: string;
}

/**
 * Parse frontmatter from template content.
 * Supports both YAML and JSON formats.
 * 
 * @example YAML format
 * ```yaml
 * ---
 * name: my_factory
 * description: My factory
 * ---
 * Template content here
 * ```
 * 
 * @example JSON format
 * ```json
 * /*---
 * {
 *   "name": "my_factory",
 *   "description": "My factory"
 * }
 * ---*\/
 * Template content here
 * ```
 */
export function parseFrontmatter<T = unknown>(content: string): ParseResult<T> {
  // YAML format: ---\n...\n---
  const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (yamlMatch) {
    const [, frontmatterText, body] = yamlMatch;
    try {
      const frontmatter = parseYAML(frontmatterText) as T;
      return { frontmatter, body: body.trimStart() };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse YAML frontmatter: ${message}`);
    }
  }

  // JSON format: /*---\n...\n---*/
  const jsonMatch = content.match(/^\/\*---\r?\n([\s\S]*?)\r?\n---\*\/\r?\n([\s\S]*)$/);
  if (jsonMatch) {
    const [, frontmatterText, body] = jsonMatch;
    try {
      const frontmatter = JSON.parse(frontmatterText) as T;
      return { frontmatter, body: body.trimStart() };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse JSON frontmatter: ${message}`);
    }
  }

  // No frontmatter found - return empty frontmatter and original content as body
  return {
    frontmatter: {} as T,
    body: content,
  };
}

/**
 * Check if content has frontmatter
 */
export function hasFrontmatter(content: string): boolean {
  return /^(---|\/\*---)/.test(content);
}

/**
 * Extract just the frontmatter text without parsing
 */
export function extractFrontmatter(content: string): string | null {
  // YAML format
  const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (yamlMatch) {
    return yamlMatch[1];
  }

  // JSON format
  const jsonMatch = content.match(/^\/\*---\r?\n([\s\S]*?)\r?\n---\*\//);
  if (jsonMatch) {
    return jsonMatch[1];
  }

  return null;
}
