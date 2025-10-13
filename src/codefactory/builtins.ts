/**
 * Built-in factories provided by the CodeFactory library
 * 
 * These factories are available out-of-the-box and demonstrate
 * common use cases, especially the meta-factory for creating new factories.
 */

import Handlebars from "handlebars";
import type { FactoryDefinition } from "./types.ts";

// Load the Handlebars template for factory generation
const factoryTemplateUrl = new URL("./factories/factory.ts.hbs", import.meta.url);
const factoryTemplateSource = await Deno.readTextFile(factoryTemplateUrl);
const factoryTemplate = Handlebars.compile(factoryTemplateSource);

/**
 * Meta-factory: A factory that creates other factories
 * 
 * This is the "factory of factories" - it allows AI to define new factories
 * using a simplified template-based approach instead of writing full factory
 * definitions with complex generate functions.
 */
export const defineFactoryFactory: FactoryDefinition = {
  name: "define_factory",
  description: "Creates a new template-based factory definition. This meta-factory allows you to define factories using simple templates with {{variable}} placeholders.",
  params: {
    name: {
      type: "string",
      description: "Unique name for the factory (e.g., 'react_component')",
      required: true,
    },
    description: {
      type: "string",
      description: "Human-readable description of what the factory does",
      required: true,
    },
    template: {
      type: "string",
      description: "Code template with {{variable}} placeholders that will be replaced with parameter values",
      required: true,
    },
    outputPath: {
      type: "string",
      description: "Optional file path template (e.g., 'src/{{componentName}}.ts'). Can use same {{variables}} as template.",
      required: false,
    },
    paramDescriptions: {
      type: "Record<string, string>",
      description: "Object mapping parameter names to their descriptions. Template variables are auto-detected.",
      required: false,
    },
  },
  examples: [
    {
      name: "typescript_function",
      description: "Creates a TypeScript function",
      template: "export function {{functionName}}({{params}}): {{returnType}} {\n  {{body}}\n}",
      outputPath: "src/{{functionName}}.ts",
      paramDescriptions: {
        functionName: "Name of the function",
        params: "Function parameters",
        returnType: "Return type",
        body: "Function body",
      },
    },
    {
      name: "react_component",
      description: "Creates a React functional component",
      template: "export function {{componentName}}(props: {{componentName}}Props) {\n  return <div>{{content}}</div>;\n}",
      outputPath: "src/components/{{componentName}}.tsx",
      paramDescriptions: {
        componentName: "Name of the component",
        content: "JSX content",
      },
    },
  ],
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
