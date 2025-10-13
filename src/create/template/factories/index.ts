/**
 * Factory Registry
 * 
 * This file registers all factories for your project.
 * Import your factory definitions and register them here.
 */

import { builtInFactories, FactoryRegistry } from "@codefactory/core";
import { apiEndpoint, typescriptFunction, typescriptInterface } from "./examples.ts";

// Create the main registry
export const registry = new FactoryRegistry();

// Register built-in factories (includes the meta-factory for creating factories!)
for (const factory of builtInFactories) {
  registry.register(factory);
}

// Register your custom factories
registry.register(typescriptFunction);
registry.register(apiEndpoint);
registry.register(typescriptInterface);

// Export for use in your application
export default registry;
