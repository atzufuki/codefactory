# Extraction-Based System

> **Your code is the source of truth**

The extraction-based system is the workflow for AI Code Factory. Your code itself becomes the source of truth.

## Table of Contents

- [Core Concept](#core-concept)
- [How It Works](#how-it-works)
- [Workflow](#workflow)
- [Markers](#markers)
- [Parameter Extraction](#parameter-extraction)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)

## Core Concept

**The Extraction-Based Approach:**
```
Factory Template → Generate Code → Edit Code → Sync (Extract & Regenerate)
                      ↓              ↓           ↓
                   Initial       Your Edits   Structure
                   Structure   (Source of    Maintained
                              Truth)
```

Your code is the single source of truth. The system extracts your changes and maintains factory structure.

## How It Works

### 1. Create from Template

```bash
/codefactory.create factory="react_component" componentName="Button" props="label,onClick"
```

Generates:

```typescript
// @codefactory:start factory="react_component"
export function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
// @codefactory:end
```

### 2. Edit the Code

You have complete freedom to edit the generated code:

```typescript
// @codefactory:start factory="react_component"
export function PrimaryButton(props: PrimaryButtonProps) {  // ← Renamed!
  // Add your custom logic
  const handleClick = () => {
    console.log('Clicked!');
    props.onClick();
  };
  
  return (
    <button 
      onClick={handleClick}
      disabled={props.disabled}  // ← Added new prop!
      className="primary"        // ← Added styling!
    >
      {props.label}
    </button>
  );
}
// @codefactory:end

// Add custom code outside markers - it's safe!
export const SecondaryButton = styled(PrimaryButton, { 
  variant: 'secondary' 
});
```

### 3. Sync Extracts Changes

```bash
/codefactory.sync "src/components/Button.tsx"
```

The system:
1. **Extracts** parameters from your code: `componentName="PrimaryButton"`, `props=["label", "onClick", "disabled"]`
2. **Regenerates** from template with extracted parameters
3. **Preserves** custom code outside markers

Result: Your edits are maintained, but structure stays consistent with factory template.

## Workflow

### Complete Example

```typescript
import { Producer, FactoryRegistry } from "@codefactory/codefactory";

// Setup
const registry = new FactoryRegistry();
await registry.autoRegister("./factories");

const producer = new Producer({
  version: "1.0.0",
  generated: new Date().toISOString(),
  factories: []
}, registry);

// 1. Create initial file
await producer.createFile("react_component", {
  componentName: "Button",
  props: ["label: string", "onClick: () => void"]
}, "src/components/Button.tsx");

// File created:
// // @codefactory:start factory="react_component"
// export function Button(props: ButtonProps) { ... }
// // @codefactory:end

// 2. Developer edits the file manually:
//    - Changes Button → PrimaryButton
//    - Adds disabled prop
//    - Adds logging

// 3. Sync the file
await producer.syncFile("src/components/Button.tsx");

// System extracts:
//   componentName: "PrimaryButton"
//   props: ["label: string", "onClick: () => void", "disabled: boolean"]
// 
// Regenerates with extracted params
// Custom code preserved!

// 4. Sync entire directory
const result = await producer.syncAll("src/components");

console.log(`Synced ${result.generated.length} files`);
if (result.errors.length > 0) {
  console.error("Errors:", result.errors);
}
```

## Markers

### Marker Format

```typescript
// @codefactory:start factory="factory_name"
// Generated code here
// @codefactory:end
```

**Features:**
- `factory="name"` identifies which factory to use
- System extracts parameters by analyzing code against template
- Simple, clear syntax

### Template Files (.hbs, .template)

For Handlebars template files:

```handlebars
{{!-- @codefactory:start factory="factory_name" --}}
Template content here
{{!-- @codefactory:end --}}
```

## Parameter Extraction

### How Extraction Works

The extraction system reverse-engineers parameters from generated code by analyzing the factory template.

**Factory Template:**
```handlebars
export function {{componentName}}(props: {{componentName}}Props) {
  return <div>{{#each props}}{{this}}, {{/each}}</div>;
}
```

**Generated Code:**
```typescript
export function PrimaryButton(props: PrimaryButtonProps) {
  return <div>label, onClick, disabled, </div>;
}
```

**Extracted Parameters:**
```json
{
  "componentName": "PrimaryButton",
  "props": ["label", "onClick", "disabled"]
}
```

### Supported Patterns

#### Simple Parameters
```handlebars
Template: const {{name}} = '{{value}}';
Code:     const myVar = 'hello';
Extracted: { name: "myVar", value: "hello" }
```

#### Loops
```handlebars
Template: {{#each items}}{{this.name}}{{/each}}
Code:     Alice Bob Charlie
Extracted: { items: ["Alice", "Bob", "Charlie"] }
```

#### Complex Structures
```handlebars
Template: {{#each props}}{{this}}: {{type}},{{/each}}
Code:     label: string, onClick: function,
Extracted: { 
  props: [
    { name: "label", type: "string" },
    { name: "onClick", type: "function" }
  ]
}
```

### Limitations

The extractor currently does **not** support:

- `{{#if}}` conditionals (code must match one branch)
- `{{#unless}}` conditionals
- Complex nested loops
- Custom Handlebars helpers

For these cases, use simpler templates or consider defining factories programmatically using TypeScript.

## API Reference

### Producer Methods

#### `createFile(factoryName, params, outputPath)`

Create a new file from factory with extraction markers.

```typescript
await producer.createFile(
  "react_component",
  { componentName: "Button", props: ["label", "onClick"] },
  "src/components/Button.tsx"
);
```

**Parameters:**
- `factoryName` (string): Name of factory to use
- `params` (object): Initial parameters
- `outputPath` (string): Where to write the file

**Throws:**
- Error if file already exists
- Error if factory not found
- Error if factory has no template

#### `syncFile(filePath)`

Sync a single file - extract parameters and regenerate.

```typescript
await producer.syncFile("src/components/Button.tsx");
```

**Parameters:**
- `filePath` (string): Path to file to sync

**Throws:**
- Error if no @codefactory marker found
- Error if factory not found
- Error if factory has no template (can't extract)

#### `syncAll(directory)`

Sync all files in directory with @codefactory markers.

```typescript
const result = await producer.syncAll("src/components");

console.log(result.success);        // boolean
console.log(result.generated);      // string[] - synced files
console.log(result.errors);         // array of { factoryCallId, error }
console.log(result.duration);       // number (ms)
```

**Parameters:**
- `directory` (string): Directory to scan recursively

**Returns:** `BuildResult` object with:
- `success` (boolean): True if all files synced
- `generated` (string[]): List of successfully synced files
- `errors` (array): List of errors encountered
- `duration` (number): Time taken in milliseconds

**Features:**
- Scans subdirectories recursively
- Skips files without markers
- Continues on errors (reports all issues)
- Preserves custom code outside markers

### Factory Requirements

For extraction to work, your factory **must**:

1. **Be a template** (.hbs file with frontmatter)
2. **Have `template` in definition** (stored by TemplateLoader)
3. **Use supported Handlebars patterns** (see Limitations above)

Example factory:

```handlebars
---
name: react_component
description: Creates a React functional component
params:
  componentName:
    type: string
    required: true
  props:
    type: array
    required: false
---
export function {{componentName}}(props: {{componentName}}Props) {
  return <div>Hello World</div>;
}
```

## Best Practices

### 1. Simple Templates

Keep templates simple for reliable extraction:

```handlebars
✅ Good:
export function {{name}}() { return '{{value}}'; }

❌ Avoid:
{{#if complexCondition}}...{{else}}...{{/if}}
```

### 2. Meaningful Markers

Use descriptive factory names in markers:

```typescript
✅ Good:
// @codefactory:start factory="react_component"

❌ Avoid:
// @codefactory:start factory="comp"
```

### 3. Custom Code Outside

Keep customizations outside markers:

```typescript
// @codefactory:start factory="react_component"
export function Button(props) { /* ... */ }
// @codefactory:end

// ✅ Custom code here - always preserved!
export const PrimaryButton = styled(Button, {...});
export const SecondaryButton = styled(Button, {...});
```

### 4. Regular Syncs

Sync after significant changes:

```bash
# After editing multiple components
/codefactory.sync "src/components"

# After changing a factory template
/codefactory.sync "src"
```

### 5. Version Control

Commit both factories and generated code:

```bash
git add factories/
git add src/components/
git commit -m "Add Button component"
```

This gives you full history of both templates and generated code.

## Troubleshooting

### "No @codefactory marker found"

**Problem:** File doesn't have extraction marker.

**Solution:** Add marker manually or use `createFile()`:

```typescript
// Manual:
// @codefactory:start factory="my_factory"
// existing code here
// @codefactory:end

// Or regenerate:
await producer.createFile("my_factory", params, filePath);
```

### "Factory has no template"

**Problem:** Factory is TypeScript-based, not template-based.

**Solution:** Convert to `.hbs` template file with Handlebars syntax.

### Extraction Returns Wrong Parameters

**Problem:** Template too complex or uses unsupported patterns.

**Solution:** Simplify template. Avoid `{{#if}}` conditionals and complex nested logic.

## Examples

See [E2E tests](../tests/e2e/) for complete working examples:

- `01-bootstrap.test.ts` - Project creation
- `02-create-file.test.ts` - Creating files with factories
- `03-edit-and-sync.test.ts` - Editing and syncing workflow
- `04-custom-code.test.ts` - Custom code preservation
- `05-cleanup.test.ts` - Cleanup

## Next Steps

- Learn about [Creating Factories](./creating-factories.md)
- Set up [MCP Integration](./mcp-setup.md) for GitHub Copilot
- Explore [Template System](./template-frontmatter.md)

---

**Remember:** Your code is the source of truth. Edit freely, sync maintains structure. 🚀
