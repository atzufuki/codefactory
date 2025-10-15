---
description: Update a factory call in the manifest
---

# Update Factory Call in Manifest

You are helping the user update an existing factory call in their `codefactory.manifest.json` file.

## Your Task

1. **Identify the factory call** by ID (from user input)
2. **Load the manifest**
3. **Parse the updates** the user wants to make
4. **Update the factory call** using ManifestManager
5. **Save the manifest**
6. **Remind user to rebuild** to apply changes

## Process

```typescript
import { ManifestManager } from "@codefactory/core";

// Load manifest
const manager = await ManifestManager.load("./codefactory.manifest.json");

// Update factory call
manager.updateFactoryCall("factory-call-id", {
  params: {
    // Updated parameters
  },
  // Can also update: outputPath, dependsOn
});

// Save manifest
await manager.save();
```

## What Can Be Updated

- **params** - Any parameter values
- **outputPath** - Where the code will be generated
- **dependsOn** - Dependency array (add/remove dependencies)

**Cannot update:**
- `id` - Use remove + add instead
- `factory` - Use remove + add instead
- `createdAt` - Automatically managed

## Usage Examples

User: "Update button-component to add onClick prop"

```typescript
manager.updateFactoryCall("button-component", {
  params: {
    props: ["label: string", "onClick: () => void"]  // Added onClick
  }
});
```

User: "Change Card output path to components/ui/Card.ts"

```typescript
manager.updateFactoryCall("card-component", {
  outputPath: "src/components/ui/Card.ts"
});
```

User: "Make card-component depend on button-component"

```typescript
manager.updateFactoryCall("card-component", {
  dependsOn: ["button-component"]
});
```

## Response Format

```
✅ Updated in manifest: [factory-call-id]

Changes:
  params.props: ["label: string"] → ["label: string", "onClick: () => void"]

📝 Changes saved to codefactory.manifest.json
🔨 Run /codefactory.produce to regenerate with new parameters
```

## Finding the ID

If user doesn't provide exact ID:
1. Load manifest and list matching factory calls
2. Ask user to confirm which one to update
3. Show current values to help user decide

```
Found multiple matches:
  1. button-component (design_system_component)
  2. button-primary-variant (design_system_component)

Which one would you like to update? (1-2)
```

## Important Notes

- **Updates are not applied** until `/codefactory.produce` is run
- **Manifest is updated immediately** - changes are saved
- **Can do dry run** with `/codefactory.produce --dry-run` to preview
- **Dependency updates** affect execution order on next build

## Validation

Before updating:
- Verify the factory call ID exists in manifest
- Validate parameter types if factory schema is available
- Check for circular dependencies if updating `dependsOn`
- Warn if changing outputPath to existing file without markers

## Error Handling

- **ID not found**: List available IDs and ask user to clarify
- **Invalid params**: Show required parameters for that factory
- **Circular dependency**: Explain the cycle and suggest fix
