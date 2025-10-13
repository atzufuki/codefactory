/**
 * create-codefactory - Project scaffolding CLI
 * 
 * Bootstraps a new project with CodeFactory already set up.
 * Usage: deno run --reload jsr:@codefactory/create <project-name>
 */

import { dirname, join } from "@std/path";

if (import.meta.main) {
  const [projectName] = Deno.args;
  
  if (!projectName || projectName === "-h" || projectName === "--help") {
    console.info(
      `Usage: create-codefactory <project-name>\n\nScaffold a new CodeFactory project in a directory.\n`
    );
    Deno.exit(1);
  }

  const targetDir = join(Deno.cwd(), projectName);
  // Use URL to support both local and remote (jsr) execution
  const templateBaseUrl = new URL("template/", import.meta.url);

  // List of all files in the template (relative to template root)
  const templateFiles = [
    "deno.json",
    ".gitignore",
    "README.md",
    "factories/index.ts",
    "factories/examples.ts",
    "src/main.ts",
    ".github/copilot-instructions.md",
    ".github/prompts/codefactory.list.prompt.md",
    ".github/prompts/codefactory.produce.prompt.md",
  ];

  // Copy all template files
  await Promise.all(
    templateFiles.map(async (relPath) => {
      const srcUrl = new URL(relPath, templateBaseUrl);
      const destFilePath = join(targetDir, relPath);
      
      // Ensure parent directory exists
      await Deno.mkdir(dirname(destFilePath), { recursive: true });
      
      let data;
      if (srcUrl.protocol === "file:") {
        data = await Deno.readFile(srcUrl);
      } else {
        const resp = await fetch(srcUrl.href);
        if (!resp.ok) throw new Error(`Failed to fetch ${srcUrl.href}`);
        data = new Uint8Array(await resp.arrayBuffer());
      }
      
      await Deno.writeFile(destFilePath, data);
    })
  );

  console.info(`\n✔ Project created in ${targetDir}`);
  console.info("\nNext steps:");
  console.info(`  cd ${projectName}`);
  console.info(`  deno task dev`);
  console.info("\nYour factories are in the 'factories/' directory.");
  console.info("Start defining your own code generation templates!");
  
  Deno.exit(0);
}
