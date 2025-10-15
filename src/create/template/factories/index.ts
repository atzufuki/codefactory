/**
 * Factory Registry
 * 
 * This file registers all factories for your project.
 * Factories are automatically discovered from this directory.
 */

import { FactoryRegistry } from "@codefactory/core";

// Create the main registry
export const registry = new FactoryRegistry();

// Register built-in factories (includes the meta-factory for creating factories!)
await registry.registerBuiltIns();

// Auto-discover and register all custom factories from this directory
// By default, all *.hbs, *.template, and *.ts files (except index.ts) are registered
await registry.autoRegister(import.meta.url);

// Export for use in your application
export default registry;
