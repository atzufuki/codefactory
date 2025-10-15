/**
 * Utility for loading factory registries
 */

import { FactoryRegistry } from "@codefactory/core";

/**
 * Default factories directory
 */
const DEFAULT_FACTORIES_DIR = "./factories";

/**
 * Get factories directory from args, environment, or use default
 */
export function getFactoriesDir(customPath?: string): string {
  return customPath ?? Deno.env.get("CODEFACTORY_FACTORIES_DIR") ?? DEFAULT_FACTORIES_DIR;
}

/**
 * Load the factory registry
 * @param customPath - Optional custom path to factories directory
 * @param pattern - Optional glob pattern for factory files (default: all supported types)
 */
export async function loadRegistry(customPath?: string, pattern?: string): Promise<FactoryRegistry> {
  const registry = new FactoryRegistry();
  
  // Load built-in factories
  await registry.registerBuiltIns();
  
  // Load user factories from directory
  const factoriesDir = getFactoriesDir(customPath);
  try {
    // Convert to file:// URL, handling both relative and absolute paths
    let dirUrl: string;
    if (factoriesDir.startsWith("/") || factoriesDir.match(/^[a-zA-Z]:\\/)) {
      // Absolute path - normalize Windows backslashes
      const normalizedPath = factoriesDir.replace(/\\/g, "/");
      dirUrl = `file:///${normalizedPath}`;
    } else {
      // Relative path
      const cwdNormalized = Deno.cwd().replace(/\\/g, "/");
      dirUrl = new URL(factoriesDir, `file:///${cwdNormalized}/`).href;
    }
    
    // Use custom pattern or default
    const options = pattern ? { pattern } : undefined;
    await registry.autoRegister(dirUrl, options);
  } catch (_error) {
    // Factories directory might not exist yet, that's okay
    // Suppress error in tests/production
  }
  
  return registry;
}
