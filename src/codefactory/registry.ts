/**
 * Registry for managing available factories
 */

import { Factory } from "./factory.ts";
import type { FactoryDefinition } from "./types.ts";

export class FactoryRegistry {
  private factories = new Map<string, Factory>();

  /**
   * Register a new factory
   */
  register(definition: FactoryDefinition): void {
    const factory = new Factory(definition);
    this.factories.set(definition.name, factory);
  }

  /**
   * Get a factory by name
   */
  get(name: string): Factory | undefined {
    return this.factories.get(name);
  }

  /**
   * List all registered factories
   */
  list(): Array<{ name: string; description: string }> {
    return Array.from(this.factories.values()).map((factory) => {
      const metadata = factory.getMetadata();
      return {
        name: metadata.name,
        description: metadata.description,
      };
    });
  }

  /**
   * Get all factory metadata for AI consumption
   */
  getCatalog() {
    return Array.from(this.factories.values()).map((factory) => factory.getMetadata());
  }
}
