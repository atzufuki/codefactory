import { FactoryRegistry } from "../../codefactory/registry.ts";
import { join } from "@std/path";

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
 * Create and configure a registry instance
 * Looks for factories in the configured factories directory
 */
export async function createRegistry(): Promise<FactoryRegistry> {
  const registry = new FactoryRegistry();
  
  // Load configuration
  const config = await loadConfig();
  const factoriesDirName = config?.factoriesDir || "factories";
  const factoriesDir = join(Deno.cwd(), factoriesDirName);
  
  try {
    // Check if factories directory exists
    const stat = await Deno.stat(factoriesDir);
    if (stat.isDirectory) {
      const factoriesUrl = new URL(`file:///${factoriesDir.replace(/\\/g, "/")}`);
      await registry.autoRegister(factoriesUrl.href, {
        pattern: "*.{hbs,template}",
        exclude: [],
        recursive: false,
      });
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
    // Directory doesn't exist - return empty registry
  }
  
  return registry;
}
