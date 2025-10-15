# Auto-Registration of Factories

Automatically discover and register all factories from a directory using convention-based discovery.

## Example

```typescript
import { builtInFactories, FactoryRegistry } from "@codefactory/core";

export const registry = new FactoryRegistry();

// Register built-in factories
for (const factory of builtInFactories) {
  registry.register(factory);
}

// Auto-discover and register all factories from this directory
await registry.autoRegister(import.meta.url);

export default registry;
```

## API Reference

### autoRegister()

```typescript
async autoRegister(
  baseUrl: string,
  options?: AutoRegisterOptions
): Promise<void>
```

**Parameters:**
- `baseUrl`: The `import.meta.url` of the calling file
- `options`: Configuration options
  - `pattern`: Glob pattern to match files (default: `"*.ts"`)
  - `exclude`: Files to exclude (default: `["index.ts"]`)
  - `recursive`: Search subdirectories recursively (default: `false`)

**Example:**

```typescript
// Basic usage
await registry.autoRegister(import.meta.url);

// With options
await registry.autoRegister(import.meta.url, {
  pattern: '*.factory.ts',
  exclude: ['index.ts', '*.test.ts'],
  recursive: true,
});
```

## Usage Examples

### Basic Usage
```typescript
// factories/index.ts
import { FactoryRegistry } from "@codefactory/core";

export const registry = new FactoryRegistry();
await registry.autoRegister(import.meta.url);

export default registry;
```

### With Options
```typescript
// Only register files ending with .factory.ts
await registry.autoRegister(import.meta.url, {
  pattern: "*.factory.ts",
  exclude: ["index.ts", "*.test.ts", "*.spec.ts"],
});
```

### Recursive Discovery
```typescript
// Find factories in subdirectories too
await registry.autoRegister(import.meta.url, {
  recursive: true,
});
```

## File Structure

### Flat Structure
```
factories/
  index.ts
  typescript-function.ts
  react-component.ts
  api-endpoint.ts
```

### Grouped Structure (with `recursive: true`)
```
factories/
  index.ts
  typescript/
    function.hbs
    interface.hbs
  react/
    component.hbs
    hook.hbs
```

## File Format

Factories are defined as Handlebars template files (`.hbs`) with frontmatter metadata. See [Template Frontmatter](./template-frontmatter.md) for details.

```handlebars
---
name: typescript_function
description: Creates a TypeScript function
params:
  functionName:
    type: string
    required: true
---
export function {{functionName}}() {
  // Implementation
}
```
