/**
 * Built-in factories provided by the CodeFactory library
 * 
 * These factories are available out-of-the-box and demonstrate
 * common use cases, especially the meta-factory for creating new factories.
 */

import Handlebars from "handlebars";
import { TemplateLoader } from "./template-loader.ts";
import type { FactoryDefinition } from "./types.ts";

// Load the factory template with frontmatter
const factoryTemplateUrl = new URL("./factories/factory.ts.hbs", import.meta.url);
const factoryTemplatePath = factoryTemplateUrl.protocol === "file:"
  ? factoryTemplateUrl.pathname.replace(/^\/([A-Z]:)/, "$1") // Fix Windows paths
  : factoryTemplateUrl.pathname;
  
const { frontmatter: factoryMeta, template: factoryTemplateSource } = 
  await TemplateLoader.loadTemplate(factoryTemplatePath);

// Compile Handlebars template for the factory generator
const factoryTemplate = Handlebars.compile(factoryTemplateSource);

/**
 * Meta-factory: A factory that creates other factories
 * 
 * This is the "factory of factories" - it allows AI to define new factories
 * using a simplified template-based approach instead of writing full factory
 * definitions with complex generate functions.
 * 
 * Metadata is now loaded from the template's YAML frontmatter.
 */
export const defineFactoryFactory: FactoryDefinition = {
  name: factoryMeta.name,
  description: factoryMeta.description,
  params: factoryMeta.params || {},
  examples: factoryMeta.examples || [],
  generate: (params) => {
    const { name, description, template, outputPath, paramDescriptions } = params as {
      name: string;
      description: string;
      template: string;
      outputPath?: string;
      paramDescriptions?: Record<string, string>;
    };

    // Convert paramDescriptions to Handlebars-friendly format
    const hbsParams = paramDescriptions && typeof paramDescriptions === "object"
      ? Object.entries(paramDescriptions).reduce((acc, [key, desc]) => {
          acc[key] = { description: desc, required: true };
          return acc;
        }, {} as Record<string, { description: string; required: boolean }>)
      : undefined;

    // Generate factory name in PascalCase + "Factory" suffix
    const factoryConstName = name
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("") + "Factory";

    // Render the Handlebars template
    const content = factoryTemplate({
      name,
      description,
      template,
      outputPath,
      params: hbsParams,
      factoryConstName,
    });

    return {
      content,
      filePath: `factories/${name}.ts`,
      metadata: {
        factoryName: name,
        isMetaFactory: true,
      },
    };
  },
};

/**
 * All built-in factories exported as an array
 */
export const builtInFactories: FactoryDefinition[] = [
  defineFactoryFactory,
];
