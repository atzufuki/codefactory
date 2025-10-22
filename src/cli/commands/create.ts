import type { Args } from "@std/cli/parse-args";
import { createRegistry } from "../utils/registry.ts";
import { Producer } from "../../codefactory/producer.ts";

export async function createCommand(args: Args): Promise<number> {
  const factoryName = args._[1]?.toString();
  
  if (!factoryName) {
    console.error("Error: Factory name is required");
    console.error('Usage: codefactory create <factory-name> --params \'{"key":"value"}\' --output <path>');
    return 1;
  }

  const paramsArg = args.params;
  const outputPath = args.output?.toString();

  if (!outputPath) {
    console.error("Error: Output path is required");
    console.error('Usage: codefactory create <factory-name> --params \'{"key":"value"}\' --output <path>');
    return 1;
  }

  // Parse params
  let params: Record<string, unknown> = {};
  if (paramsArg) {
    try {
      params = JSON.parse(paramsArg);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: Invalid JSON in --params: ${message}`);
      return 1;
    }
  }

  // Create registry and producer
  const registry = await createRegistry();
  const producer = new Producer(registry);

  // Check if factory exists
  const factory = registry.get(factoryName);
  if (!factory) {
    console.error(`Error: Factory "${factoryName}" not found`);
    console.error('\nRun "codefactory list" to see available factories.');
    return 1;
  }

  // Create the file
  try {
    await producer.createFile(factoryName, params, outputPath);
    console.log(`✓ Created ${outputPath}`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error creating file: ${message}`);
    return 1;
  }
}
