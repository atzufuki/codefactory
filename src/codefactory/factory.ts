/**
 * Factory class for defining code generation templates
 */

import type { FactoryDefinition, FactoryParams, FactoryResult } from "./types.ts";

export class Factory {
  constructor(private definition: FactoryDefinition) {}

  /**
   * Get the raw template string (for extraction)
   */
  get template(): string | undefined {
    return this.definition.template;
  }

  /**
   * Execute the factory with given parameters
   */
  async execute(params: FactoryParams): Promise<FactoryResult> {
    // TODO: Add parameter validation
    return await this.definition.generate(params);
  }

  /**
   * Get factory metadata for AI consumption
   */
  getMetadata(): {
    name: string;
    description: string;
    params: Record<string, unknown>;
    examples: Record<string, unknown>[] | undefined;
    spec: import("./types.ts").SpecField | undefined;
  } {
    return {
      name: this.definition.name,
      description: this.definition.description,
      params: this.definition.params,
      examples: this.definition.examples,
      spec: this.definition.spec,
    };
  }

  /**
   * Static factory method to create a new Factory
   */
  static define(definition: FactoryDefinition): Factory {
    return new Factory(definition);
  }
}
