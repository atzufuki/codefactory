import type { Args } from "@std/cli/parse-args";
import { createRegistry } from "../utils/registry.ts";
import { Producer } from "../../codefactory/producer.ts";
import { join } from "@std/path";

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
      const fileName = targetPath.split(/[/\\]/).pop() || "";
      
      // Check if it's a factory template
      if (fileName.endsWith('.hbs') || fileName.endsWith('.template')) {
        // Factory file - sync all files using this factory
        const factoryName = fileName.replace(/\.(hbs|template)$/, "");
        console.log(`\n🏭 Factory detected: ${factoryName}`);
        console.log(`🔍 Finding files that use this factory...\n`);
        
        const results = await syncByFactory(producer, targetPath, factoryName);
        
        if (results.generated.length === 0) {
          console.log(`ℹ️  No files found using factory: ${factoryName}`);
          return 0;
        }
        
        console.log(`✓ Synced ${results.generated.length} file(s) using factory '${factoryName}':\n`);
        for (const filePath of results.generated) {
          console.log(`  ${filePath}`);
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
        // Source file - sync just this file
        await producer.syncFile(targetPath);
        console.log(`✓ Synced ${targetPath}`);
        return 0;
      }
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

/**
 * Sync all files that use a specific factory
 */
async function syncByFactory(
  producer: Producer,
  factoryFilePath: string,
  factoryName: string
): Promise<{ generated: string[]; errors: Array<{ factoryCallId: string; error: string }> }> {
  const generated: string[] = [];
  const errors: Array<{ factoryCallId: string; error: string }> = [];

  // Find directory to scan (typically project root or src/)
  const workspaceRoot = findWorkspaceRoot(factoryFilePath);
  const srcDir = join(workspaceRoot, "src");

  // Find all files using this factory
  const files = await findFilesUsingFactory(srcDir, factoryName);

  for (const file of files) {
    try {
      await producer.syncFile(file);
      generated.push(file);
    } catch (error) {
      errors.push({
        factoryCallId: file,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { generated, errors };
}

/**
 * Find workspace root from a file path
 */
function findWorkspaceRoot(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  
  // Look for common workspace indicators
  for (let i = parts.length - 1; i >= 0; i--) {
    const testPath = parts.slice(0, i + 1).join('/');
    try {
      // Check if .codefactory.json exists
      Deno.statSync(join(testPath, '.codefactory.json'));
      return testPath;
    } catch {
      // Continue searching
    }
  }
  
  // Fallback to parent of factories directory
  const factoriesIndex = parts.findIndex(p => p === 'factories');
  if (factoriesIndex > 0) {
    return parts.slice(0, factoriesIndex).join('/');
  }
  
  // Last resort: use cwd
  return Deno.cwd();
}

/**
 * Recursively find all files using a specific factory
 */
async function findFilesUsingFactory(
  directory: string,
  factoryName: string
): Promise<string[]> {
  const files: string[] = [];

  try {
    for await (const entry of Deno.readDir(directory)) {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory) {
        const subFiles = await findFilesUsingFactory(fullPath, factoryName);
        files.push(...subFiles);
      } else if (entry.isFile) {
        if (await fileUsesFactory(fullPath, factoryName)) {
          files.push(fullPath);
        }
      }
    }
  } catch {
    // Ignore errors (directory not found, permission denied, etc.)
  }

  return files;
}

/**
 * Check if file uses a specific factory
 */
async function fileUsesFactory(
  filePath: string,
  factoryName: string
): Promise<boolean> {
  try {
    const content = await Deno.readTextFile(filePath);
    return content.includes(`@codefactory ${factoryName}`);
  } catch {
    return false;
  }
}
