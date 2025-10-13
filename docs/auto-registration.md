# Auto-Registration of Factories

## Status
**Proposed** - Not yet implemented

## Problem Statement

Currently, users must manually register each factory in `factories/index.ts`:

```typescript
import { builtInFactories, FactoryRegistry } from "@codefactory/core";
import { apiEndpoint, typescriptFunction, typescriptInterface } from "./examples.ts";
import { designSystemComponent } from "./design_system_component.ts";

export const registry = new FactoryRegistry();

// Register built-in factories
for (const factory of builtInFactories) {
  registry.register(factory);
}

// Manually register each custom factory
registry.register(typescriptFunction);
registry.register(apiEndpoint);
registry.register(typescriptInterface);
registry.register(designSystemComponent);

export default registry;
```

This creates several problems:
- **Manual maintenance**: Every new factory requires updating `index.ts`
- **Easy to forget**: Developer adds factory but forgets to register it
- **Import boilerplate**: Must import every factory manually
- **Not scalable**: Large projects with many factories become unwieldy
- **Merge conflicts**: Multiple developers editing same index file

## Solution: Convention-Based Auto-Discovery

Automatically discover and register all factories in the `factories/` directory:

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

That's it! Drop any factory file in `factories/` directory and it's automatically registered.

## Architecture

### Auto-Registration API

```typescript
// src/codefactory/registry.ts

export class FactoryRegistry {
  private factories = new Map<string, FactoryDefinition>();

  /**
   * Manually register a single factory
   */
  register(factory: FactoryDefinition): void {
    if (this.factories.has(factory.name)) {
      throw new Error(`Factory "${factory.name}" is already registered`);
    }
    this.factories.set(factory.name, factory);
  }

  /**
   * Auto-discover and register factories from a directory
   * 
   * @param baseUrl - The import.meta.url of the calling file
   * @param options - Configuration options
   * 
   * @example
   * // In factories/index.ts
   * await registry.autoRegister(import.meta.url);
   * 
   * @example
   * // With options
   * await registry.autoRegister(import.meta.url, {
   *   pattern: '*.factory.ts',
   *   exclude: ['index.ts', '*.test.ts'],
   *   recursive: true,
   * });
   */
  async autoRegister(
    baseUrl: string,
    options: AutoRegisterOptions = {}
  ): Promise<void> {
    const {
      pattern = "*.ts",
      exclude = ["index.ts"],
      recursive = false,
    } = options;

    const basePath = new URL(".", baseUrl).pathname;
    const factories = await this.discoverFactories(basePath, {
      pattern,
      exclude,
      recursive,
    });

    for (const factory of factories) {
      this.register(factory);
    }
  }

  /**
   * Discover factories in a directory
   */
  private async discoverFactories(
    dirPath: string,
    options: DiscoveryOptions
  ): Promise<FactoryDefinition[]> {
    const factories: FactoryDefinition[] = [];

    for await (const entry of Deno.readDir(dirPath)) {
      // Skip excluded files
      if (this.shouldExclude(entry.name, options.exclude)) {
        continue;
      }

      if (entry.isFile) {
        // Check if file matches pattern
        if (this.matchesPattern(entry.name, options.pattern)) {
          const filePath = `${dirPath}/${entry.name}`;
          const discovered = await this.loadFactoriesFromFile(filePath);
          factories.push(...discovered);
        }
      } else if (entry.isDirectory && options.recursive) {
        // Recursively discover in subdirectories
        const subFactories = await this.discoverFactories(
          `${dirPath}/${entry.name}`,
          options
        );
        factories.push(...subFactories);
      }
    }

    return factories;
  }

  /**
   * Load all factory exports from a TypeScript file
   */
  private async loadFactoriesFromFile(
    filePath: string
  ): Promise<FactoryDefinition[]> {
    try {
      const module = await import(filePath);
      const factories: FactoryDefinition[] = [];

      // Check all exports for FactoryDefinition objects
      for (const [key, value] of Object.entries(module)) {
        if (this.isFactoryDefinition(value)) {
          factories.push(value as FactoryDefinition);
        }
      }

      return factories;
    } catch (error) {
      console.warn(`Failed to load factories from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Type guard to check if an object is a FactoryDefinition
   */
  private isFactoryDefinition(obj: unknown): obj is FactoryDefinition {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "name" in obj &&
      "description" in obj &&
      "generate" in obj &&
      typeof (obj as any).name === "string" &&
      typeof (obj as any).generate === "function"
    );
  }

  /**
   * Check if filename should be excluded
   */
  private shouldExclude(filename: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        return regex.test(filename);
      }
      return filename === pattern;
    });
  }

  /**
   * Check if filename matches pattern
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return regex.test(filename);
  }
}

export interface AutoRegisterOptions {
  /** Glob pattern to match files (default: "*.ts") */
  pattern?: string;
  /** Files to exclude (default: ["index.ts"]) */
  exclude?: string[];
  /** Whether to search subdirectories recursively (default: false) */
  recursive?: boolean;
}

interface DiscoveryOptions {
  pattern: string;
  exclude: string[];
  recursive: boolean;
}
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
  exclude: ["index.ts", "**/*.test.ts"],
});
```

### Manual + Auto Registration
```typescript
// Mix manual and auto registration
import { specialFactory } from "./special-case.ts";

export const registry = new FactoryRegistry();

// Manually register specific factories first
registry.register(specialFactory);

// Then auto-register the rest
await registry.autoRegister(import.meta.url, {
  exclude: ["index.ts", "special-case.ts"],
});
```

## File Structure Conventions

### Flat Structure (Default)
```
factories/
  index.ts                 # Registry with autoRegister
  typescript-function.ts   # Exported factory
  react-component.ts       # Exported factory
  api-endpoint.ts          # Exported factory
```

### Grouped Structure (Recursive)
```
factories/
  index.ts                 # Registry with recursive: true
  typescript/
    function.ts
    interface.ts
    class.ts
  react/
    component.ts
    hook.ts
  api/
    endpoint.ts
    middleware.ts
```

### Naming Conventions
```
factories/
  index.ts
  my-factory.ts           ✅ Kebab-case
  myFactory.ts            ✅ CamelCase
  my_factory.ts           ✅ Snake-case
  my.factory.ts           ✅ With .factory suffix
  MyFactory.ts            ✅ PascalCase
```

## Export Conventions

### Single Export (Recommended)
```typescript
// factories/typescript-function.ts
import { defineFactory } from "@codefactory/core";

export const typescriptFunction = defineFactory({
  name: "typescript_function",
  description: "Creates a TypeScript function",
  // ...
});
```

### Multiple Exports
```typescript
// factories/typescript.ts
import { defineFactory } from "@codefactory/core";

export const typescriptFunction = defineFactory({ /* ... */ });
export const typescriptClass = defineFactory({ /* ... */ });
export const typescriptInterface = defineFactory({ /* ... */ });

// All three will be auto-registered!
```

### Named Export Convention
```typescript
// Any exported FactoryDefinition will be registered
export const myFactory = defineFactory({ /* ... */ });
export const anotherFactory = defineFactory({ /* ... */ });

// These will be ignored (not FactoryDefinition objects)
export const helper = () => {};
export const config = { foo: "bar" };
```

## Benefits

### ✅ Zero Configuration
Drop a factory file, it's automatically registered. No boilerplate.

### ✅ Developer Experience
- No imports to manage
- No manual registration calls
- Can't forget to register a factory

### ✅ Scalability
Works with 1 factory or 100 factories. No index.ts maintenance burden.

### ✅ Discoverability
New team members just add files to `factories/` directory. Convention is clear.

### ✅ Flexibility
Can still manually register factories when needed for special cases.

### ✅ Type Safety
TypeScript will catch any export that doesn't match `FactoryDefinition` interface.

## Error Handling

### Duplicate Factory Names
```typescript
// factories/foo.ts
export const factory1 = defineFactory({ name: "my_factory", /* ... */ });

// factories/bar.ts
export const factory2 = defineFactory({ name: "my_factory", /* ... */ });

// Error: Factory "my_factory" is already registered
```

### Invalid Factory Files
```typescript
// factories/broken.ts
export const brokenFactory = { name: "broken" }; // Missing required fields

// Warning logged, but registration continues:
// "Failed to load factories from factories/broken.ts: ..."
```

### Missing Directory
```typescript
await registry.autoRegister(import.meta.url);

// If factories/ doesn't exist, silently succeeds (0 factories registered)
// Or could throw error - TBD based on user preference
```

## Implementation Plan

### Phase 1: Core Auto-Registration
- [ ] Add `autoRegister()` method to `FactoryRegistry`
- [ ] Implement file discovery with pattern matching
- [ ] Implement factory type guard (`isFactoryDefinition`)
- [ ] Add error handling for invalid files
- [ ] Add duplicate name detection
- [ ] Unit tests for all edge cases

### Phase 2: Options & Configuration
- [ ] Support `pattern` option for file matching
- [ ] Support `exclude` option for ignoring files
- [ ] Support `recursive` option for subdirectories
- [ ] Add glob pattern matching (basic wildcard support)
- [ ] Unit tests for options

### Phase 3: Template Project Integration
- [ ] Update template `factories/index.ts` to use `autoRegister()`
- [ ] Remove manual registration code
- [ ] Update documentation
- [ ] Add examples for different structures

### Phase 4: Advanced Features
- [ ] Watch mode: auto-reload on file changes (dev mode)
- [ ] Performance: cache discovered factories
- [ ] Diagnostics: `registry.list()` to see all registered factories
- [ ] Validation: `registry.validate()` to check for issues

### Phase 5: Documentation
- [ ] Document conventions in README
- [ ] Add examples for different project structures
- [ ] Migration guide from manual registration
- [ ] Best practices guide

## Migration Path

### Before (Manual Registration)
```typescript
import { builtInFactories, FactoryRegistry } from "@codefactory/core";
import { factory1 } from "./factory1.ts";
import { factory2 } from "./factory2.ts";
import { factory3 } from "./factory3.ts";

export const registry = new FactoryRegistry();

for (const factory of builtInFactories) {
  registry.register(factory);
}

registry.register(factory1);
registry.register(factory2);
registry.register(factory3);

export default registry;
```

### After (Auto Registration)
```typescript
import { builtInFactories, FactoryRegistry } from "@codefactory/core";

export const registry = new FactoryRegistry();

for (const factory of builtInFactories) {
  registry.register(factory);
}

await registry.autoRegister(import.meta.url);

export default registry;
```

**Result**: 8 lines removed, zero imports needed!

## Open Questions

1. **Error vs Warning**: Should invalid factory files throw errors or just log warnings?
   - Proposal: Log warnings in dev, throw in production

2. **Default exclude pattern**: What files should be excluded by default?
   - Proposal: `["index.ts", "*.test.ts", "*.spec.ts", "_*.ts"]`

3. **Factory name conflicts**: How to handle factories with same name in different files?
   - Proposal: Throw error (names must be globally unique)
   - Alternative: Use file path as namespace (e.g., `typescript/function`)

4. **Performance**: Should discovery be cached?
   - Proposal: Cache in production, always reload in dev mode

5. **JSR/remote imports**: How does auto-registration work with published packages?
   - Proposal: Works the same (Deno supports `readDir` on file:// URLs)
   - Need to test with JSR imports

## Success Metrics

- ✅ Zero imports in `factories/index.ts`
- ✅ Reduce boilerplate by 80%+
- ✅ No manual registration calls (except built-ins)
- ✅ Works with 1-100+ factories
- ✅ Clear error messages for common mistakes
- ✅ 100% test coverage

## Related Issues

- Complements template frontmatter system (auto-discover `.hbs` files)
- Enables hot-reloading in dev mode (watch for new files)
- Foundation for factory marketplace (auto-install from registry)
- Simplifies getting started (less boilerplate)

## References

- Deno dynamic imports: https://deno.land/manual/runtime/import_meta_api
- Convention over configuration: https://en.wikipedia.org/wiki/Convention_over_configuration
- Angular auto-discovery: https://angular.io/guide/file-structure
- NestJS auto-discovery: https://docs.nestjs.com/modules#feature-modules
