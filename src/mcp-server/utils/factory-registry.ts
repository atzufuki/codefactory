/**
 * Utility for loading factory registries
 */

import { FactoryRegistry } from "@codefactory/core";

/**
 * Default factories directory
 */
const DEFAULT_FACTORIES_DIR = "./factories";

/**
 * CodeFactory configuration structure
 */
interface CodefactoryConfig {
  factoriesDir?: string;
  defaultOutputDir?: string;
}

/**
 * Load .codefactory.json configuration if it exists
 */
async function loadConfig(): Promise<CodefactoryConfig | null> {
  try {
    const configText = await Deno.readTextFile(".codefactory.json");
    return JSON.parse(configText) as CodefactoryConfig;
  } catch {
    return null;
  }
}

/**
 * Get factories directory from args, config file, environment, or use default
 */
export async function getFactoriesDir(customPath?: string): Promise<string> {
  if (customPath) {
    return customPath;
  }
  
  // Try config file first
  const config = await loadConfig();
  if (config?.factoriesDir) {
    return config.factoriesDir;
  }
  
  // Fall back to environment variable (for backwards compatibility)
  const envDir = Deno.env.get("CODEFACTORY_FACTORIES_DIR");
  if (envDir) {
    return envDir;
  }
  
  return DEFAULT_FACTORIES_DIR;
}

/**
 * Load the factory registry
 * @param customPath - Optional custom path to factories directory
 * @param pattern - Optional glob pattern for factory files (default: all supported types)
 */
export async function loadRegistry(customPath?: string, pattern?: string): Promise<FactoryRegistry> {
  const registry = new FactoryRegistry();
  
  // Load built-in factories (includes core factories from src/codefactory/factories)
  await registry.registerBuiltIns();
  
  // Load user factories from directory
  const factoriesDir = await getFactoriesDir(customPath);
  
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
  } catch (error) {
    // Log error but don't fail - factories directory might not exist yet
    console.error(`Note: Could not load user factories from ${factoriesDir}:`, error instanceof Error ? error.message : String(error));
  }
  
  return registry;
}
