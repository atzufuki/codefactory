import type { Args } from "@std/cli/parse-args";
import { createRegistry } from "../utils/registry.ts";
import { Producer } from "../../codefactory/producer.ts";

export async function syncCommand(args: Args): Promise<number> {
  const targetPath = args._[1]?.toString();

  if (!targetPath) {
    console.error("Error: Path is required");
    console.error("Usage: codefactory sync <path>");
    return 1;
  }

  // Create registry and producer
  const registry = await createRegistry();
  const producer = new Producer(registry);

  try {
    // Check if path is a file or directory
    const stat = await Deno.stat(targetPath);

    if (stat.isFile) {
      // Sync single file
      await producer.syncFile(targetPath);
      console.log(`✓ Synced ${targetPath}`);
      return 0;
    } else if (stat.isDirectory) {
      // Sync all files in directory
      const results = await producer.syncAll(targetPath);
      
      if (results.generated.length === 0) {
        console.log(`No factory-managed files found in ${targetPath}`);
      } else {
        console.log(`\n✓ Synced ${results.generated.length} file(s):\n`);
        for (const filePath of results.generated) {
          console.log(`  ${filePath}`);
        }
      }
      
      if (results.errors.length > 0) {
        console.error(`\n⚠ Errors occurred during sync:\n`);
        for (const error of results.errors) {
          console.error(`  ${error.factoryCallId}: ${error.error}`);
        }
        return 1;
      }
      return 0;
    } else {
      console.error(`Error: ${targetPath} is not a file or directory`);
      return 1;
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(`Error: Path not found: ${targetPath}`);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error syncing: ${message}`);
    }
    return 1;
  }
}
