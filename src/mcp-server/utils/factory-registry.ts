/**
 * Utility for loading factory registries
 */

import { FactoryRegistry } from "@codefactory/core";

/**
 * Default factories directory
 */
const DEFAULT_FACTORIES_DIR = "./factories";

/**
 * Get factories directory from environment or use default
 */
export function getFactoriesDir(): string {
  return Deno.env.get("CODEFACTORY_FACTORIES_DIR") ?? DEFAULT_FACTORIES_DIR;
}

/**
 * Load the factory registry
 */
export async function loadRegistry(): Promise<FactoryRegistry> {
  const registry = new FactoryRegistry();
  
  // Load built-in factories
  await registry.registerBuiltIns();
  
  // Load user factories from directory
  const factoriesDir = getFactoriesDir();
  try {
    const dirUrl = new URL(factoriesDir, `file://${Deno.cwd()}/`);
    await registry.autoRegister(dirUrl.href);
  } catch (error) {
    // Factories directory might not exist yet, that's okay
    console.error(`Note: Could not load factories from ${factoriesDir}:`, error instanceof Error ? error.message : error);
  }
  
  return registry;
}
