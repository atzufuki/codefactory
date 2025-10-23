import type { Args } from "@std/cli/parse-args";
import { join } from "@std/path";
import { copy } from "@std/fs/copy";

/**
 * Get the template directory path
 */
function getTemplateDir(): string {
  const templateUrl = new URL("../templates/", import.meta.url);
  return templateUrl.pathname.replace(/^\/([A-Z]:)/, "$1"); // Fix Windows paths
}

/**
 * Copy a file from template directory to target directory
 */
async function copyTemplateFile(templateFile: string, targetFile: string): Promise<void> {
  const templateDir = getTemplateDir();
  const sourcePath = join(templateDir, templateFile);
  await copy(sourcePath, targetFile, { overwrite: false });
}

/**
 * Copy entire directory from template to target
 */
async function copyTemplateDir(templateDir: string, targetDir: string): Promise<void> {
  const templateRoot = getTemplateDir();
  const sourcePath = join(templateRoot, templateDir);
  await copy(sourcePath, targetDir, { overwrite: false });
}

export async function initCommand(args: Args): Promise<number> {
  const targetDir = args._[1]?.toString() || Deno.cwd();
  
  console.log(`Initializing codefactory project in ${targetDir}...\n`);

  // Check if already initialized
  const factoriesDir = join(targetDir, "factories");
  try {
    const stat = await Deno.stat(factoriesDir);
    if (stat.isDirectory) {
      console.error(`Error: factories/ directory already exists in ${targetDir}`);
      console.error("Project may already be initialized.");
      return 1;
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }

  // Create src directory
  await Deno.mkdir(join(targetDir, "src"), { recursive: true });

  // Copy root files
  await copyTemplateFile("README.md", join(targetDir, "README.md"));
  console.log("✓ Created README.md");

  await copyTemplateFile(".gitignore", join(targetDir, ".gitignore"));
  console.log("✓ Created .gitignore");

  await copyTemplateFile(".codefactory.json", join(targetDir, ".codefactory.json"));
  console.log("✓ Created .codefactory.json");

  // Copy factories directory
  await copyTemplateDir("factories", join(targetDir, "factories"));
  console.log("✓ Created factories/ with example template");

  // Copy .vscode directory
  await copyTemplateDir(".vscode", join(targetDir, ".vscode"));
  console.log("✓ Created .vscode/settings.json");

  // Copy .github directory
  await copyTemplateDir(".github", join(targetDir, ".github"));
  console.log("✓ Created GitHub Copilot configuration");

  console.log(`
✓ CodeFactory project initialized!

Project structure:
  factories/           Factory templates
  .vscode/            VSCode + Copilot configuration
  .github/            Copilot instructions & commands
  src/                Your source code
  README.md           Project documentation
  .codefactory.json   CodeFactory configuration

Next steps:
  1. List available factories:
     codefactory list

  2. Create your first file:
     codefactory create example_component \\
       --params '{"componentName":"Button","hasProps":true}' \\
       --output src/Button.ts

  3. Edit the file freely, then sync:
     codefactory sync src/Button.ts

  4. OR use GitHub Copilot:
     Open Copilot Chat and try:
     /codefactory.create "Button component"

For more: https://github.com/atzufuki/codefactory
`);
  
  return 0;
}
