---
description: Remove a factory call from the manifest
---

# Remove Factory Call from Manifest

You are helping the user remove a factory call from their `codefactory.manifest.json` file.

## Your Task

1. **Identify the factory call** by ID (from user input)
2. **Load the manifest**
3. **Check for dependencies** - warn if other factory calls depend on this one
4. **Remove the factory call** using ManifestManager
5. **Save the manifest**
6. **Optionally offer to delete** the generated file

## Process

```typescript
import { ManifestManager } from "@codefactory/core";

// Load manifest
const manager = await ManifestManager.load("./codefactory.manifest.json");

// Check dependencies first
const manifest = manager.getManifest();
const dependents = manifest.factories.filter(f => 
  f.dependsOn?.includes("factory-call-id")
);

if (dependents.length > 0) {
  // Warn user about dependencies
  console.warn(`⚠️  Warning: ${dependents.length} factory calls depend on this one`);
  // List them and ask for confirmation
}

// Remove factory call
manager.removeFactoryCall("factory-call-id");

// Save manifest
await manager.save();
```

## Response Format

### No Dependencies

```
✅ Removed from manifest: [factory-call-id]

Factory: [factory_name]
Output: [outputPath]

📝 Removed from codefactory.manifest.json

Would you like me to also delete the generated file?
  📄 [outputPath]

(Respond 'yes' to delete, or 'no' to keep the file)
```

### With Dependencies

```
⚠️  Warning: Cannot remove [factory-call-id]

The following factory calls depend on it:
  - card-component (depends on button-component)
  - header-component (depends on button-component)

Options:
1. Remove dependencies first, then remove this factory call
2. Update dependencies to remove this dependency
3. Remove all dependent factory calls together

What would you like to do?
```

## Finding the ID

If user doesn't provide exact ID:
1. Load manifest and list matching factory calls
2. Ask user to confirm which one to remove
3. Show details to help user decide

```
Found multiple matches:
  1. button-component (design_system_component) → src/components/Button.ts
  2. button-primary (design_system_component) → src/components/ButtonPrimary.ts

Which one would you like to remove? (1-2)
```

## File Deletion

After removing from manifest, ask about generated file:

**If file exists:**
```
The generated file still exists:
  📄 src/components/Button.ts

Delete this file? (yes/no)
```

**If file has user code outside markers:**
```
⚠️  Warning: The file contains custom code outside markers

// @codefactory:start id="button-component"
// Generated code
// @codefactory:end

// Custom code found here!
export const PrimaryButton = ...

Deleting will remove ALL code including custom code.
Are you sure? (yes/no)
```

## Cascade Removal

If user wants to remove a factory call with dependencies:

```
Removing [factory-call-id] will break dependencies for:
  - card-component
  - header-component

Options:
1. Remove just [factory-call-id] (dependencies will error on next build)
2. Also remove dependent factory calls (cascade delete)
3. Cancel and update dependencies first

Choose option (1-3):
```

## Important Notes

- **Removal is immediate** - saved to manifest right away
- **Generated files are NOT deleted** automatically (ask user)
- **Check for dependencies** before removing
- **Cannot undo** - consider showing dry run first

## Safety Checks

Before removing:
1. ✅ Confirm the ID exists
2. ✅ Check for dependent factory calls
3. ✅ Check if generated file has user code outside markers
4. ✅ Ask for confirmation if dependencies exist

## Error Handling

- **ID not found**: List available IDs and ask user to clarify
- **Has dependencies**: Explain impact and offer options
- **File deletion fails**: Report error but confirm manifest update succeeded
