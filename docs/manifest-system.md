# Manifest System

> Two-phase code generation: Plan with AI, Build deterministically

## What Is It?

A **manifest** is a JSON file that stores "recipes" for what code to generate.

Think of it like:
- **Docker**: Dockerfile = manifest, `docker build` = build
- **package.json**: Dependencies = manifest, `npm install` = build
- **CodeFactory**: `codefactory.manifest.json` = manifest, `/codefactory.produce` = build

## Why Two Phases?

**Phase 1 - Planning** (with AI):
- You describe what you want
- AI figures out which factory to use and parameters
- Saves to `codefactory.manifest.json`
- **No code generated yet**

**Phase 2 - Building** (deterministic, no AI):
- Read manifest
- Execute factories with saved parameters
- Generate code to files
- **Always same output for same manifest**

### Benefits

✅ **Deterministic** - Same manifest = Same code. Every time.  
✅ **Fast** - No AI during build. Instant regeneration.  
✅ **Version Control** - Commit manifest to Git. Team shares "recipe".  
✅ **Rebuildable** - Update factory definitions → Rebuild all with new version.  
✅ **Dependencies** - Automatic execution order based on what depends on what.

---

## Manifest File Format

```json
{
  "version": "1.0.0",
  "lastGenerated": "2025-10-15T10:30:00Z",
  "factories": [
    {
      "id": "button-component",
      "factory": "react_component",
      "params": {
        "componentName": "Button",
        "props": ["label: string", "onClick: () => void"]
      },
      "outputPath": "src/components/Button.tsx",
      "createdAt": "2025-10-15T09:00:00Z"
    },
    {
      "id": "card-component",
      "factory": "react_component",
      "params": {
        "componentName": "Card",
        "props": ["title: string", "content: string"]
      },
      "outputPath": "src/components/Card.tsx",
      "dependsOn": ["button-component"],
      "createdAt": "2025-10-15T09:05:00Z"
    }
  ]
}
```

**Each factory call has**:
- `id` - Unique name (like "button-component")
- `factory` - Which factory to use (like "react_component")
- `params` - Parameters for the factory
- `outputPath` - Where code will be written
- `dependsOn` - Optional array of other IDs this depends on

---

## Workflow with Copilot

### 1. Add to Manifest

```bash
/codefactory.add "a Button component with label and onClick props"
```

**What happens**:
- AI parses your description
- Determines factory: `react_component`
- Extracts params: `{componentName: "Button", props: [...]}`
- Saves to `codefactory.manifest.json`
- **No code generated yet**

### 2. Build from Manifest

```bash
/codefactory.produce
```

**What happens**:
- Reads `codefactory.manifest.json`
- Executes factories in correct order (dependencies first)
- Generates code to files with markers
- **Deterministic - always same output**

### 3. Update and Rebuild

```bash
/codefactory.update button-component "add disabled prop"
/codefactory.produce
```

**What happens**:
- Updates params in manifest
- Rebuilds just the changed file
- Preserves user code outside markers

### 4. Remove

```bash
/codefactory.remove button-component
```

**What happens**:
- Removes from manifest
- Optionally deletes generated file

### 5. Inspect

```bash
/codefactory.inspect
```

**What happens**:
- Shows all factory calls
- Displays dependency graph
- Shows build status

---

## Dependencies

If one component uses another, use `dependsOn`:

```json
{
  "id": "user-list",
  "factory": "react_component",
  "params": { "componentName": "UserList" },
  "outputPath": "src/components/UserList.tsx",
  "dependsOn": ["user-card"]
}
```

**Build order**: `user-card` is generated first, then `user-list`.

CodeFactory automatically sorts by dependencies (topological sort).

---

## Marker-Based Files

Generated code is wrapped in markers:

```typescript
// @codefactory:start id="button-component"
export function Button(props: { label: string; onClick: () => void }) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
// @codefactory:end

// Your custom code here - safe from regeneration
export const PrimaryButton = styled(Button, { variant: 'primary' });
```

**Rules**:
- Content **between markers** = replaced on rebuild
- Content **outside markers** = preserved forever
- If file exists **without markers** = error (won't overwrite)

---

## Best Practices

### ✅ Do

- Commit `codefactory.manifest.json` to Git
- Use descriptive IDs (`button-component` not `comp1`)
- Add dependencies with `dependsOn`
- Let AI infer parameters from description

### ❌ Don't

- Don't edit between markers (will be overwritten)
- Don't generate code immediately (use manifest)
- Don't skip `/codefactory.produce` after updates

---

## Advanced: API Usage

For contributors or advanced users who need programmatic access:

```typescript
import { ManifestManager, Producer, FactoryRegistry } from "@codefactory/core";

// Load manifest
const manager = await ManifestManager.load("./codefactory.manifest.json");

// Add factory call
manager.addFactoryCall({
  id: "my-component",
  factory: "component_factory",
  params: { name: "MyComponent" },
  outputPath: "src/MyComponent.ts",
});
await manager.save();

// Build
const registry = new FactoryRegistry();
await registry.autoRegister("./factories");
const producer = new Producer(manager.getManifest(), registry);
await producer.buildAll();
```

See `docs/for-contributors.md` for full API details.

---

## Summary

| Concept | What It Does |
|---------|--------------|
| **Manifest** | JSON file storing factory calls (the "recipe") |
| **Factory Call** | One entry in manifest (like "button-component") |
| **Add** | Save factory call to manifest (planning) |
| **Produce** | Execute manifest to generate code (building) |
| **Markers** | Protect user code from regeneration |
| **Dependencies** | Automatic build order based on `dependsOn` |

**Remember**: Same manifest = Same code. Always.

---

**Next**: See `docs/creating-factories.md` to learn about the `factory` factory.
