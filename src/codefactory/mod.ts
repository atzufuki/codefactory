/**
 * AI Code Factory - Meta-factory for deterministic code generation
 * 
 * This library enables developers to define code generation templates (factories)
 * that AI assistants can use to generate consistent, predictable code.
 * 
 * @module
 */

export { Factory } from "./factory.ts";
export { FactoryRegistry } from "./registry.ts";
export { defineFactory } from "./builder.ts";
export { builtInFactories, defineFactoryFactory } from "./builtins.ts";
export type { FactoryDefinition, FactoryParams, FactoryResult } from "./types.ts";
export type { TemplateFactoryDefinition } from "./builder.ts";
