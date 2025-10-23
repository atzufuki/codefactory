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
export type { AutoRegisterOptions } from "./registry.ts";
export { TemplateLoader } from "./template-loader.ts";
export { parseFrontmatter, hasFrontmatter, extractFrontmatter } from "./frontmatter.ts";
export { Producer } from "./producer.ts";
export type { FactoryDefinition, FactoryParams, FactoryResult } from "./types.ts";
export type {  LoadedTemplate, LoadDirectoryOptions } from "./template-loader.ts";
export type { ParseResult } from "./frontmatter.ts";
export type { BuildResult, BuildError, BuildPreview } from "./producer.ts";
