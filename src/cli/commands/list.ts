import type { Args } from "@std/cli/parse-args";
import { createRegistry } from "../utils/registry.ts";

export async function listCommand(_args: Args): Promise<number> {
  const registry = await createRegistry();
  const factories = registry.list();

  if (factories.length === 0) {
    console.log("No factories found in factories/ directory.");
    console.log('Run "codefactory init" to create example templates.');
    return 0;
  }

  console.log(`\nAvailable factories (${factories.length}):\n`);

  for (const factoryInfo of factories) {
    // Get full factory to access metadata
    const factory = registry.get(factoryInfo.name);
    
    console.log(`  ${factoryInfo.name}`);
    if (factoryInfo.description) {
      console.log(`    ${factoryInfo.description}`);
    }
    
    // Try to get outputPath from factory metadata if available
    if (factory) {
      // deno-lint-ignore no-explicit-any
      const definition = (factory as any).definition;
      if (definition?.outputPath) {
        console.log(`    Output: ${definition.outputPath}`);
      }
    }
    console.log();
  }
  
  return 0;
}
