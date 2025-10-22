import type { Args } from "@std/cli/parse-args";
import { createRegistry } from "../utils/registry.ts";

export async function validateCommand(_args: Args): Promise<number> {
  const registry = await createRegistry();
  const factories = registry.list();

  if (factories.length === 0) {
    console.log("No factories found to validate.");
    console.log('Run "codefactory init" to create example templates.');
    return 0;
  }

  console.log(`Validating ${factories.length} factory template(s)...\n`);

  let hasErrors = false;

  for (const factoryInfo of factories) {
    const factory = registry.get(factoryInfo.name);
    
    if (!factory) {
      console.error(`✗ ${factoryInfo.name}: Factory not found in registry`);
      hasErrors = true;
      continue;
    }

    try {
      // Try to generate with empty params to validate template
      const metadata = factory.getMetadata();
      const testParams: Record<string, unknown> = {};
      
      // Create minimal params for testing
      if (metadata.params) {
        for (const [key, value] of Object.entries(metadata.params)) {
          if (typeof value === "string") {
            testParams[key] = "test";
          } else if (typeof value === "number") {
            testParams[key] = 0;
          } else if (typeof value === "boolean") {
            testParams[key] = false;
          } else if (Array.isArray(value)) {
            testParams[key] = [];
          } else {
            testParams[key] = {};
          }
        }
      }

      await factory.execute(testParams);
      console.log(`✓ ${factoryInfo.name}: Valid`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ ${factoryInfo.name}: ${message}`);
      hasErrors = true;
    }
  }

  console.log();

  if (hasErrors) {
    console.error("Validation failed with errors.");
    return 1;
  } else {
    console.log("✓ All factories are valid!");
    return 0;
  }
}
