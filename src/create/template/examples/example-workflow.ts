#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Complete Manifest System Workflow Example
 * 
 * This script demonstrates:
 * 1. Creating a manifest
 * 2. Adding factory calls
 * 3. Building the project
 * 4. Updating factory calls
 * 5. Rebuilding
 */

// In a real project, you would import from "@codefactory/codefactory"
// For this template example, we use relative paths
import { ManifestManager, Producer, FactoryRegistry } from "../../../codefactory/mod.ts";
import type { FactoryCall, BuildError } from "../../../codefactory/mod.ts";
import { join } from "@std/path";

const MANIFEST_PATH = "./codefactory.manifest.json";
const OUTPUT_DIR = "./generated";

async function main() {
  console.log("🏭 CodeFactory Manifest Workflow Example\n");

  // Step 1: Load or create manifest
  console.log("📋 Step 1: Load manifest");
  const manager = await ManifestManager.load(MANIFEST_PATH);
  console.log(`   Loaded manifest from ${MANIFEST_PATH}`);
  console.log(`   Current factory calls: ${manager.getAllFactoryCalls().length}\n`);

  // Step 2: Add factory calls to manifest
  console.log("➕ Step 2: Add factory calls to manifest");
  
  // Ensure we don't duplicate
  const existingIds = manager.getAllFactoryCalls().map((c: FactoryCall) => c.id);
  
  if (!existingIds.includes("button-component")) {
    manager.addFactoryCall({
      id: "button-component",
      factory: "design_system_component",
      params: {
        componentName: "Button",
        props: ["label: string", "onClick: () => void", "disabled?: boolean"],
        baseClass: "LitElement",
      },
      outputPath: join(OUTPUT_DIR, "Button.ts"),
    });
    console.log("   ✅ Added: button-component");
  } else {
    console.log("   ⏭️  Skipped: button-component (already exists)");
  }

  if (!existingIds.includes("card-component")) {
    manager.addFactoryCall({
      id: "card-component",
      factory: "design_system_component",
      params: {
        componentName: "Card",
        props: ["title: string", "content: string", "footer?: string"],
        baseClass: "LitElement",
      },
      outputPath: join(OUTPUT_DIR, "Card.ts"),
    });
    console.log("   ✅ Added: card-component");
  } else {
    console.log("   ⏭️  Skipped: card-component (already exists)");
  }

  if (!existingIds.includes("snackbar-component")) {
    manager.addFactoryCall({
      id: "snackbar-component",
      factory: "design_system_component",
      params: {
        componentName: "Snackbar",
        props: ["message: string", "duration?: number"],
        baseClass: "LitElement",
      },
      outputPath: join(OUTPUT_DIR, "Snackbar.ts"),
      dependsOn: ["button-component"], // Depends on Button
    });
    console.log("   ✅ Added: snackbar-component (depends on button-component)");
  } else {
    console.log("   ⏭️  Skipped: snackbar-component (already exists)");
  }

  await manager.save();
  console.log(`\n   💾 Saved manifest to ${MANIFEST_PATH}\n`);

  // Step 3: Show execution order
  console.log("📊 Step 3: Check execution order");
  const executionOrder = manager.getExecutionOrder();
  console.log("   Factory calls will be executed in this order:");
  executionOrder.forEach((call: FactoryCall, i: number) => {
    const deps = call.dependsOn ? ` (after ${call.dependsOn.join(", ")})` : "";
    console.log(`   ${i + 1}. ${call.id}${deps}`);
  });
  console.log();

  // Step 4: Preview with dry run
  console.log("🔍 Step 4: Dry run (preview)");
  const registry = new FactoryRegistry();
  await registry.autoRegister("./factories");
  
  const producer = new Producer(manager.getManifest(), registry);
  const preview = await producer.dryRun();
  
  console.log(`   Will generate ${preview.willGenerate.length} files:`);
  preview.willGenerate.forEach((file: string) => {
    const isNew = preview.willCreate.includes(file);
    const isUpdate = preview.willUpdate.includes(file);
    const icon = isNew ? "➕" : isUpdate ? "🔄" : "📝";
    console.log(`     ${icon} ${file}`);
  });
  
  if (preview.errors.length > 0) {
    console.log(`\n   ⚠️  ${preview.errors.length} errors:`);
    preview.errors.forEach((err: string) => console.log(`     ❌ ${err}`));
    console.log("\n   Fix errors before building.\n");
    return;
  }
  console.log();

  // Step 5: Build
  console.log("🏗️  Step 5: Build from manifest");
  console.log("   Building...");
  
  const startTime = Date.now();
  const result = await producer.buildAll();
  const duration = Date.now() - startTime;
  
  if (result.success) {
    console.log(`\n   ✅ Build successful! (${duration}ms)`);
    console.log(`   Generated ${result.generated.length} files:`);
    result.generated.forEach((file: string) => {
      console.log(`     📄 ${file}`);
    });
  } else {
    console.log(`\n   ❌ Build failed! (${duration}ms)`);
    console.log(`   Errors (${result.errors.length}):`);
    result.errors.forEach((err: BuildError) => {
      console.log(`     • ${err.factoryCallId}: ${err.error}`);
    });
  }
  console.log();

  // Step 6: Update and rebuild (example)
  console.log("🔄 Step 6: Update example");
  console.log("   To update a factory call:");
  console.log(`   manager.updateFactoryCall("button-component", {`);
  console.log(`     params: { ...newParams }`);
  console.log(`   });`);
  console.log(`   await manager.save();`);
  console.log(`   await producer.buildAll();`);
  console.log();

  // Step 7: Summary
  console.log("📈 Summary");
  console.log(`   Manifest: ${MANIFEST_PATH}`);
  console.log(`   Factory calls: ${manager.getAllFactoryCalls().length}`);
  console.log(`   Generated files: ${result.generated.length}`);
  console.log(`   Build duration: ${result.duration}ms`);
  console.log();
  console.log("✨ Done! Check the generated/ directory for output files.");
}

// Run if executed directly
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error:", error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error("❌ Error:", String(error));
    }
    Deno.exit(1);
  }
}
