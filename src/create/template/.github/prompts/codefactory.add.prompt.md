---
description: Add a factory call to the manifest (planning phase)
---

# Add Factory Call to Manifest

You are helping the user add a factory call to their `codefactory.manifest.json` file.

## Your Task

1. **Parse the user's intent** from their description
2. **Determine which factory** to use based on available factories
3. **Extract parameters** needed for that factory
4. **Generate a unique ID** for this factory call (kebab-case, descriptive)
5. **Add the factory call** to the manifest using ManifestManager
6. **Save the manifest** to disk

## Process

```typescript
import { ManifestManager } from "@codefactory/core";

// Load or create manifest
const manager = await ManifestManager.load("./codefactory.manifest.json");

// Add factory call
manager.addFactoryCall({
  id: "unique-id-here",           // e.g., "button-component", "user-api-endpoint"
  factory: "factory_name",         // Determined from user intent
  params: {
    // Extract from user description
  },
  outputPath: "src/path/to/file.ts",  // Where code will be generated
  dependsOn: [],                   // Optional: IDs of other factory calls this depends on
});

// Save manifest
await manager.save();
```

## Available Factories

Check the `factories/` directory or use the factory registry to see what's available:

```typescript
import { registry } from "./factories/index.ts";
const catalog = registry.getCatalog();
// Use catalog to determine which factory matches user intent
```

## Response Format

After adding to manifest, respond with:

```
✅ Added to manifest: [descriptive-id]

Factory: [factory_name]
Output: [outputPath]
Parameters:
  - [param1]: [value1]
  - [param2]: [value2]

📝 The factory call has been saved to codefactory.manifest.json
🔨 Run /codefactory.produce to generate the code
```

## Important Notes

- **Do NOT generate code yet** - this is the planning phase
- **Do NOT execute the factory** - just add to manifest
- Generate a **unique, descriptive ID** (kebab-case)
- Infer sensible defaults for parameters if not specified
- Suggest dependencies if this component might depend on others already in manifest

## Example

User: "Add a Button component to manifest"

You:
1. Determine factory: `design_system_component`
2. Generate ID: `button-component`
3. Extract params: `{ componentName: "Button", props: ["label: string"] }`
4. Output path: `src/components/Button.ts`
5. Add to manifest
6. Respond with confirmation

## Error Handling

- If factory doesn't exist, suggest creating one or choosing another
- If ID conflicts with existing, generate alternative
- If required parameters missing, ask user for clarification
