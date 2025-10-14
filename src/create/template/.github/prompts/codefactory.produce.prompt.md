---
description: Build code from manifest (deterministic execution phase)
---

# Produce Code from Manifest

You are helping the user build their project from the `codefactory.manifest.json` file.

## Your Task

1. **Load the manifest** from disk
2. **Load the factory registry** with available factories
3. **Create a Producer** instance
4. **Execute the build** (buildAll or specific IDs)
5. **Report results** to the user

## Process

```typescript
import { ManifestManager, Producer } from "@codefactory/core";
import { registry } from "./factories/index.ts";

// Load manifest
const manager = await ManifestManager.load("./codefactory.manifest.json");
const manifest = manager.getManifest();

// Create producer with manifest and registry
const producer = new Producer(manifest, registry);

// Build all factory calls
const result = await producer.buildAll();

// Or build specific IDs:
// const result = await producer.build(["button-component", "user-list"]);
```

## Build Result Structure

```typescript
interface BuildResult {
  success: boolean;
  generated: GeneratedFile[];    // Files that were created/updated
  errors: BuildError[];          // Any errors encountered
  duration: number;              // Build time in milliseconds
}

interface GeneratedFile {
  path: string;                  // File path
  factoryCallId: string;         // Which factory call generated it
  status: "created" | "updated" | "unchanged";
}
```

## Response Format

### Successful Build

```
✅ Build completed successfully

Generated files:
  ✓ src/components/Button.ts (button-component) - created
  ✓ src/components/Card.ts (card-component) - updated
  ✓ src/api/users.ts (user-api) - created

⏱️ Completed in 234ms
```

### Partial Failure

```
⚠️ Build completed with errors

Generated files:
  ✓ src/components/Button.ts (button-component) - created
  ✗ src/components/Card.ts (card-component) - failed

Errors:
  • card-component: Factory "unknown_factory" not found in registry
    
💡 Fix the errors and run /codefactory.produce again
```

### Complete Failure

```
❌ Build failed

Errors:
  • Manifest file not found at ./codefactory.manifest.json
  
💡 Use /codefactory.add to create factory calls first
```

## Options

### Build Specific Factory Calls

If user specifies IDs:
```typescript
const result = await producer.build(["button-component", "user-api"]);
```

### Dry Run (Preview)

To show what would be generated without actually creating files:
```typescript
const preview = await producer.dryRun();
```

Response:
```
📋 Dry run - no files will be modified

Would generate:
  • src/components/Button.ts (button-component)
  • src/components/Card.ts (card-component)
  • src/api/users.ts (user-api)

Dependencies:
  user-api → button-component (depends on)

Run /codefactory.produce to execute
```

## Important Notes

- **This is deterministic** - No AI inference, pure factory execution
- **Fast** - No AI calls means subsecond builds
- **Respects dependencies** - Execution order automatically determined
- **Marker-based** - Generated code wrapped in `@codefactory:start/end` markers
- **Safe regeneration** - Only replaces content between markers

## Marker-Based File Management

All generated files use markers:

```typescript
// @codefactory:start id="button-component"
export function Button(props: { label: string }) {
  return `<button>${props.label}</button>`;
}
// @codefactory:end

// User's custom code here - safe from regeneration
```

**First generation**: Creates file with markers
**Regeneration**: Replaces only content between markers
**Error if no markers**: Refuses to generate if file exists without markers

## Error Handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| Manifest not found | Run `/codefactory.add` to create factory calls |
| Factory not found | Check factory name in manifest, ensure factory exists |
| File exists without markers | Delete file, add markers manually, or change outputPath |
| Circular dependency | Remove circular dependsOn references |
| Invalid parameters | Update factory call with `/codefactory.update` |

## Build Strategies

### Full Rebuild
```
User: /codefactory.produce
AI: Builds all factory calls in manifest
```

### Incremental Build
```
User: /codefactory.produce button-component user-api
AI: Builds only specified IDs
```

### Preview First
```
User: Show me what would be generated
AI: Runs dryRun(), shows preview
User: /codefactory.produce
AI: Executes actual build
```

## After Build

Suggest next steps:
- **Review generated files** - Check the output
- **Run tests** - If project has tests
- **Add more factories** - Use `/codefactory.add`
- **Update parameters** - Use `/codefactory.update`
- **Commit manifest** - `git add codefactory.manifest.json`

## Example Workflow

```
User: /codefactory.produce

AI responds:
✅ Build completed successfully

Generated files:
  ✓ src/components/md3-button.ts (button-component) - created
  ✓ src/components/md3-card.ts (card-component) - created  
  ✓ src/components/md3-snackbar.ts (snackbar-component) - created

⏱️ Completed in 156ms

All components have been generated! 
Try running `deno run src/main.ts` to see them in action.
```

## Performance Notes

- Typical build: **<500ms** for 10-20 factory calls
- No AI calls means consistent, fast builds
- Parallel execution planned for future (respecting dependencies)
- Can rebuild entire project in subsecond time

## Related Commands

- `/codefactory.add` - Add more factory calls before building
- `/codefactory.inspect` - See what's in manifest before building
- `/codefactory.update` - Modify factory calls, then rebuild
- `/codefactory.remove` - Remove factory calls, then rebuild
