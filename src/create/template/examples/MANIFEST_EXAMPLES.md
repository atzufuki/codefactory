# Manifest System Examples

This directory contains examples of using the CodeFactory manifest system.

## What is the Manifest System?

The manifest system allows you to:
1. **Plan** your code generation (add factory calls to manifest)
2. **Build** deterministically (execute manifest to generate code)
3. **Rebuild** when factories improve
4. **Track** what was generated and with what parameters

## Quick Start

### 1. Direct Generation (Immediate)

Generate code immediately without manifest:

```typescript
import { FactoryRegistry } from "@codefactory/codefactory";

const registry = new FactoryRegistry();
await registry.autoRegister("./factories");

const factory = registry.get("design_system_component");
const result = await factory.execute({
  componentName: "Button",
  props: ["label: string", "onClick: () => void"],
});

console.log(result.content);
```

### 2. Manifest-Based (Recommended for Projects)

#### Add to Manifest (Planning Phase)

```typescript
import { ManifestManager } from "@codefactory/codefactory";

const manager = await ManifestManager.load("./codefactory.manifest.json");

// Add factory calls
manager.addFactoryCall({
  id: "button-component",
  factory: "design_system_component",
  params: {
    componentName: "Button",
    props: ["label: string", "onClick: () => void"],
  },
  outputPath: "src/components/md3-button.ts",
});

manager.addFactoryCall({
  id: "card-component",
  factory: "design_system_component",
  params: {
    componentName: "Card",
    props: ["title: string", "content: string"],
  },
  outputPath: "src/components/md3-card.ts",
});

await manager.save();
console.log("Added 2 components to manifest");
```

#### Build from Manifest (Execution Phase)

```typescript
import { ManifestManager, Producer, FactoryRegistry } from "@codefactory/codefactory";

// Load manifest
const manager = await ManifestManager.load("./codefactory.manifest.json");

// Load factories
const registry = new FactoryRegistry();
await registry.autoRegister("./factories");

// Build all
const producer = new Producer(manager.getManifest(), registry);
const result = await producer.buildAll();

if (result.success) {
  console.log(`✅ Generated ${result.generated.length} files:`);
  result.generated.forEach(file => console.log(`  - ${file}`));
} else {
  console.error("❌ Build failed:");
  result.errors.forEach(err => console.error(`  - ${err.factoryCallId}: ${err.error}`));
}
```

### 3. Managing the Manifest

#### Update Factory Call

```typescript
// Update parameters
manager.updateFactoryCall("button-component", {
  params: {
    componentName: "Button",
    props: ["label: string", "onClick: () => void", "disabled?: boolean"],
  },
});

await manager.save();
// Run producer.buildAll() to regenerate
```

#### Remove Factory Call

```typescript
manager.removeFactoryCall("card-component");
await manager.save();

// Optionally delete the generated file
await Deno.remove("src/components/md3-card.ts");
```

#### Inspect Manifest

```typescript
const calls = manager.getAllFactoryCalls();
console.log(`Manifest contains ${calls.length} factory calls:`);

calls.forEach(call => {
  console.log(`\n${call.id}:`);
  console.log(`  Factory: ${call.factory}`);
  console.log(`  Output: ${call.outputPath}`);
  console.log(`  Created: ${call.createdAt}`);
  if (call.dependsOn) {
    console.log(`  Depends on: ${call.dependsOn.join(", ")}`);
  }
});
```

### 4. Dependencies Between Factories

```typescript
// Component depends on nothing
manager.addFactoryCall({
  id: "user-model",
  factory: "typescript_interface",
  params: { name: "User", fields: ["id: string", "name: string"] },
  outputPath: "src/models/User.ts",
});

// API depends on the model
manager.addFactoryCall({
  id: "user-api",
  factory: "api_endpoint",
  params: { path: "/api/users", model: "User" },
  outputPath: "src/api/users.ts",
  dependsOn: ["user-model"], // Will be built after user-model
});

await manager.save();

// Producer will execute in correct order
const result = await producer.buildAll();
// user-model is generated first, then user-api
```

### 5. Dry Run (Preview)

```typescript
const preview = await producer.dryRun();

console.log("Will generate:");
preview.willGenerate.forEach(file => console.log(`  📝 ${file}`));

console.log("\nWill create:");
preview.willCreate.forEach(file => console.log(`  ➕ ${file}`));

console.log("\nWill update:");
preview.willUpdate.forEach(file => console.log(`  🔄 ${file}`));

if (preview.errors.length > 0) {
  console.log("\nErrors:");
  preview.errors.forEach(err => console.error(`  ❌ ${err}`));
}
```

### 6. Build Specific Factory Calls

```typescript
// Build only specific IDs
const result = await producer.build(["button-component", "card-component"]);
```

## Marker-Based Generation

All generated code is wrapped in markers:

```typescript
// @codefactory:start id="button-component"
export class Button extends LitElement {
  // Generated code
}
// @codefactory:end

// Your custom code here - safe to edit
export const PrimaryButton = styled(Button, { variant: 'primary' });
```

**Important:**
- Content between markers is replaced on rebuild
- Content outside markers is preserved
- Files without markers cannot be regenerated (error)

## Best Practices

1. **Separate concerns**: Use `.generated.ts` suffix for pure generated files
   ```
   src/components/
     Button.generated.ts   # From factory
     Button.ts             # Your wrapper
   ```

2. **Use dependencies**: Link related factory calls
   ```typescript
   dependsOn: ["other-factory-call-id"]
   ```

3. **Version control**: Commit `codefactory.manifest.json` to Git
   - Team shares the same "recipe"
   - Regenerate on any machine

4. **Rebuild after factory updates**: When factory definitions improve
   ```bash
   deno task build  # Regenerates all with new factory versions
   ```

5. **Incremental development**: Add to manifest as you go
   ```typescript
   // Day 1: Add components
   manager.addFactoryCall(buttonCall);
   
   // Day 2: Add API
   manager.addFactoryCall(apiCall);
   
   // Day 3: Build all
   await producer.buildAll();
   ```

## Complete Example

See `example-workflow.ts` for a full working example with:
- Creating a manifest
- Adding multiple factory calls
- Building the project
- Updating and rebuilding
- Error handling

Run it:
```bash
deno run --allow-read --allow-write example-workflow.ts
```
