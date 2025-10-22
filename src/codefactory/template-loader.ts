/**
 * Template loader for factory definitions with frontmatter
 * 
 * Loads template files with embedded metadata and converts them to FactoryDefinition objects.
 */

import { parseFrontmatter } from "./frontmatter.ts";
import type { FactoryDefinition, ParamDefinition } from "./types.ts";
import { validateFactoryParamsWithWarnings } from "./validator.ts";
import Handlebars from "handlebars";

/**
 * Frontmatter metadata for a factory template
 */
export interface TemplateFrontmatter {
  name: string;
  description: string;
  params?: Record<string, ParamDefinition>;
  examples?: Array<Record<string, unknown>>;
  outputPath?: string;
}

/**
 * Result of loading a template file
 */
export interface LoadedTemplate {
  frontmatter: TemplateFrontmatter;
  template: string;
}

/**
 * Template loader class for discovering and loading factory templates
 */
export class TemplateLoader {
  /**
   * Load a single template file and parse its frontmatter
   * 
   * @param templatePath - Absolute path to the template file
   * @returns Parsed frontmatter and template body
   * 
   * @example
   * ```ts
   * const { frontmatter, template } = await TemplateLoader.loadTemplate("./factory.hbs");
   * ```
   */
  static async loadTemplate(templatePath: string): Promise<LoadedTemplate> {
    let content = await Deno.readTextFile(templatePath);
    
    // Strip codefactory markers if present (both old and new formats)
    // Old format: // @codefactory:start and // @codefactory:end
    content = content.replace(/^.*@codefactory:start.*$(\r?\n)?/gm, "");
    content = content.replace(/^.*@codefactory:end.*$(\r?\n)?/gm, "");
    
    // New format: JSDoc-style metadata block /** @codefactory factory ... */
    // This regex matches the entire JSDoc block including all lines
    content = content.replace(/\/\*\*[\s\S]*?@codefactory[\s\S]*?\*\/(\r?\n)?/g, "");
    
    // Remove any leading/trailing whitespace left by marker removal
    content = content.trimStart();
    
    const { frontmatter, body } = parseFrontmatter<TemplateFrontmatter>(content);

    // Validate required fields
    if (!frontmatter.name) {
      throw new Error(`Template at ${templatePath} missing required field: name`);
    }
    if (!frontmatter.description) {
      throw new Error(`Template at ${templatePath} missing required field: description`);
    }

    return {
      frontmatter,
      template: body,
    };
  }

  /**
   * Convert a loaded template into a FactoryDefinition
   * 
   * @param frontmatter - Template metadata
   * @param template - Template body
   * @returns Factory definition ready to be registered
   * 
   * @example
   * ```ts
   * const factory = TemplateLoader.toFactoryDefinition(frontmatter, template);
   * registry.register(factory);
   * ```
   */
  static toFactoryDefinition(
    frontmatter: TemplateFrontmatter,
    template: string
  ): FactoryDefinition {
    // Validate parameters before creating factory
    // Skip validation for the meta-factory since it generates other factories
    // and legitimately needs code abstraction parameters like "template"
    if (frontmatter.params && frontmatter.name !== "factory") {
      validateFactoryParamsWithWarnings(frontmatter.params);
    }
    
    // Compile the Handlebars template once
    // Use noEscape: true to prevent HTML encoding in code generation
    // (e.g., "() => void" should not become "() &#x3D;&gt; void")
    const compiledTemplate = Handlebars.compile(template, { noEscape: true });
    
    return {
      name: frontmatter.name,
      description: frontmatter.description,
      params: frontmatter.params || {},
      examples: frontmatter.examples || [],
      template: template, // Store raw template for extraction
      generate: (params) => {
        // Render using Handlebars for full syntax support
        const content = compiledTemplate(params);
        
        return {
          content,
          filePath: frontmatter.outputPath
            ? Handlebars.compile(frontmatter.outputPath, { noEscape: true })(params)
            : undefined,
        };
      },
    };
  }

  /**
   * Load all template files from a directory
   * 
   * @param dirPath - Absolute path to directory containing templates
   * @param options - Loading options
   * @returns Array of factory definitions
   * 
   * @example
   * ```ts
   * const factories = await TemplateLoader.loadDirectory("./factories");
   * for (const factory of factories) {
   *   registry.register(factory);
   * }
   * ```
   */
  static async loadDirectory(
    dirPath: string,
    options: LoadDirectoryOptions = {}
  ): Promise<FactoryDefinition[]> {
    const {
      extensions = [".hbs", ".template"],
      recursive = false,
    } = options;

    const factories: FactoryDefinition[] = [];

    try {
      for await (const entry of Deno.readDir(dirPath)) {
        if (entry.isFile) {
          // Check if file has a matching extension
          const hasMatchingExtension = extensions.some(ext => entry.name.endsWith(ext));
          
          if (hasMatchingExtension) {
            try {
              const templatePath = `${dirPath}/${entry.name}`;
              const { frontmatter, template } = await this.loadTemplate(templatePath);
              const factory = this.toFactoryDefinition(frontmatter, template);
              factories.push(factory);
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              console.warn(`Failed to load template ${entry.name}: ${message}`);
            }
          }
        } else if (entry.isDirectory && recursive) {
          // Recursively load from subdirectories
          const subFactories = await this.loadDirectory(
            `${dirPath}/${entry.name}`,
            options
          );
          factories.push(...subFactories);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read - return empty array
      if (error instanceof Deno.errors.NotFound) {
        return [];
      }
      throw error;
    }

    return factories;
  }

  /**
   * Load a single template file and convert to factory definition
   * 
   * Convenience method that combines loadTemplate() and toFactoryDefinition()
   * 
   * @param templatePath - Path to template file
   * @returns Factory definition
   */
  static async loadFactory(templatePath: string): Promise<FactoryDefinition> {
    const { frontmatter, template } = await this.loadTemplate(templatePath);
    return this.toFactoryDefinition(frontmatter, template);
  }
}

/**
 * Options for loading templates from a directory
 */
export interface LoadDirectoryOptions {
  /** File extensions to consider as templates (default: [".hbs", ".template"]) */
  extensions?: string[];
  /** Whether to recursively search subdirectories (default: false) */
  recursive?: boolean;
}
