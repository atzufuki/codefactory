/**
 * Meta-factory: A factory that creates other factories
 * 
 * This allows AI to define new factories using a simplified template-based approach
 * instead of writing full factory definitions with complex generate functions.
 */

import type { FactoryDefinition, FactoryParams, ParamDefinition } from "./types.ts";
import { parseTemplateVariables, renderTemplate } from "./template.ts";

/**
 * Simplified factory definition using templates
 */
export interface TemplateFactoryDefinition {
  name: string;
  description: string;
  template: string;
  outputPath?: string;
  params?: Record<string, Omit<ParamDefinition, "type">>;
  examples?: Array<Record<string, unknown>>;
}

/**
 * Creates a factory definition from a template-based definition
 */
export function defineFactory(def: TemplateFactoryDefinition): FactoryDefinition {
  // Parse template to discover required variables
  const templateVars = parseTemplateVariables(def.template);
  
  // Build parameter definitions
  const params: Record<string, ParamDefinition> = {};
  
  for (const varName of templateVars) {
    if (def.params && def.params[varName]) {
      // Use provided parameter definition
      params[varName] = {
        type: "string", // Default type
        ...def.params[varName],
      };
    } else {
      // Auto-generate parameter definition
      params[varName] = {
        type: "string",
        description: `Value for ${varName}`,
        required: true,
      };
    }
  }
  
  // Create the full factory definition
  return {
    name: def.name,
    description: def.description,
    params,
    examples: def.examples,
    generate: (factoryParams: FactoryParams) => {
      const content = renderTemplate(def.template, factoryParams);
      
      // If outputPath is a template, render it too
      let filePath: string | undefined;
      if (def.outputPath) {
        filePath = renderTemplate(def.outputPath, factoryParams);
      }
      
      return {
        content,
        filePath,
      };
    },
  };
}
