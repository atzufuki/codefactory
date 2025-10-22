# Factory Parameter Design Guidelines

## Core Principle: Data, Not Code

Factory parameters must be **primitive data points**, never code syntax or abstractions.

## Why This Matters

### ❌ The Problem: Code in Parameters
```yaml
# BAD DESIGN
params:
  props:
    type: string[]
    description: Component props

# Usage:
props: ["label: string", "onClick?: () => void"]
```

**Issues:**
1. 🔴 Contains TypeScript syntax (`string`, `() => void`)
2. 🔴 AI must generate code inside strings
3. 🔴 Hard to extract back reliably
4. 🔴 Breaks separation of concerns
5. 🔴 Enables code injection

### ✅ The Solution: Separate Data Points
```yaml
# GOOD DESIGN
params:
  propNames:
    type: string[]
    description: Array of prop names only
  propTypes:
    type: string[]
    description: Array of prop types only

# Usage:
propNames: ["label", "onClick"]
propTypes: ["string", "() => void"]
```

**Benefits:**
1. ✅ Clear data boundaries
2. ✅ No code injection possible
3. ✅ Easy to validate
4. ✅ AI just provides data
5. ✅ Reliable extraction

## Pattern Examples

### Web Component Props

❌ **Bad:**
```yaml
props:
  type: string[]  # ["label: string", "disabled: boolean"]
```

✅ **Good:**
```yaml
propNames:
  type: string[]  # ["label", "disabled"]
propTypes:
  type: string[]  # ["string", "boolean"]
```

**Template usage:**
```handlebars
{{#each propNames}}
  {{this}}: {{lookup ../propTypes @index}};
{{/each}}
```

### Signals with Defaults

❌ **Bad:**
```yaml
signals:
  type: string[]  # ["count: number = 0", "isOpen: boolean = false"]
```

✅ **Good:**
```yaml
signalNames:
  type: string[]      # ["count", "isOpen"]
signalTypes:
  type: string[]      # ["number", "boolean"]
signalDefaults:
  type: string[]      # ["0", "false"]
```

**Template usage:**
```handlebars
{{#each signalNames}}
  {{this}} = signal<{{lookup ../signalTypes @index}}>({{lookup ../signalDefaults @index}});
{{/each}}
```

### Function Parameters

❌ **Bad:**
```yaml
params:
  type: string[]  # ["x: number", "y: number", "options?: Options"]
```

✅ **Good:**
```yaml
paramNames:
  type: string[]      # ["x", "y", "options"]
paramTypes:
  type: string[]      # ["number", "number", "Options"]
paramOptional:
  type: boolean[]     # [false, false, true]
```

**Template usage:**
```handlebars
function {{functionName}}(
  {{#each paramNames}}
  {{this}}{{#if (lookup ../paramOptional @index)}}?{{/if}}: {{lookup ../paramTypes @index}}{{#unless @last}},{{/unless}}
  {{/each}}
)
```

### Interface Fields

❌ **Bad:**
```yaml
fields:
  type: string[]  # ["id: string", "name: string", "age?: number"]
```

✅ **Good:**
```yaml
fieldNames:
  type: string[]      # ["id", "name", "age"]
fieldTypes:
  type: string[]      # ["string", "string", "number"]
fieldOptional:
  type: boolean[]     # [false, false, true]
```

**Template usage:**
```handlebars
interface {{interfaceName}} {
  {{#each fieldNames}}
  {{this}}{{#if (lookup ../fieldOptional @index)}}?{{/if}}: {{lookup ../fieldTypes @index}};
  {{/each}}
}
```

## Validation Rules

The validator will warn about these patterns:

### 🚨 Suspicious Parameter Names

If a `string[]` parameter has these names (without proper suffix):
- `props`, `properties`
- `params`, `parameters`
- `arguments`, `args`
- `fields`, `members`
- `attributes`
- `signals`
- `methods`, `functions`

**Fix:** Add suffix like `Names`, `Types`, `Values`, `Defaults`

### ✅ Acceptable Suffixes
- `propNames`, `propTypes`, `propDefaults`
- `paramNames`, `paramTypes`
- `fieldNames`, `fieldTypes`, `fieldOptional`
- `signalNames`, `signalTypes`, `signalDefaults`

## When to Use Each Primitive Type

### `string`
- Names, identifiers
- Class names, function names
- Tag names, element names
- Simple text values
- **Max length:** Use `maxLength` to prevent code blocks

### `number`
- Counts, sizes
- Indexes, positions
- Numeric configuration values

### `boolean`
- Feature flags (on/off)
- Optional behaviors
- Configuration switches

### `string[]`
- Lists of names
- Lists of types
- Lists of identifiers
- **NOT for:** Combined syntax like "name: type"

### `number[]`
- Lists of numeric values
- Coordinate arrays
- Configuration value lists

### `boolean[]`
- Optional flags for arrays
- Feature flag lists

### `enum:value1|value2|...`
- Predefined options
- Alignment: `enum:left|center|right`
- Size: `enum:small|medium|large`
- Type: `enum:primary|secondary|danger`

## Template Techniques

### Parallel Arrays with `lookup`

```handlebars
{{#each names}}
  {{this}}: {{lookup ../types @index}};
{{/each}}
```

Combines:
- `names: ["a", "b"]`
- `types: ["string", "number"]`

Result:
```
a: string;
b: number;
```

### Conditional with Boolean Arrays

```handlebars
{{#each names}}
  {{this}}{{#if (lookup ../optional @index)}}?{{/if}}: {{lookup ../types @index}};
{{/each}}
```

Combines:
- `names: ["a", "b"]`
- `types: ["string", "number"]`
- `optional: [false, true]`

Result:
```
a: string;
b?: number;
```

### Default Values

```handlebars
{{#each names}}
  {{this}} = {{lookup ../defaults @index}};
{{/each}}
```

Combines:
- `names: ["count", "isOpen"]`
- `defaults: ["0", "false"]`

Result:
```
count = 0;
isOpen = false;
```

## Anti-Patterns to Avoid

### ❌ Code Injection
```yaml
body:
  type: string
  description: Function body
```
The entire implementation shouldn't be a parameter!

### ❌ Combined Syntax
```yaml
props:
  type: string[]  # ["name: type", "other: type"]
```
Separate name and type!

### ❌ JSX/HTML Content
```yaml
content:
  type: string
  description: JSX content
```
Use feature flags and structure instead!

### ❌ Callback Implementation
```yaml
callback:
  type: string
  description: Callback function code
```
Provide hooks, not implementations!

## Best Practices

### ✅ DO:
1. Separate concerns (names vs types vs defaults)
2. Use enums for predefined options
3. Use booleans for feature flags
4. Keep strings short with `maxLength`
5. Use `pattern` for validation
6. Think: "What data configures this?"

### ❌ DON'T:
1. Put TypeScript syntax in parameters
2. Let parameters contain multiple concerns
3. Allow code injection through strings
4. Create parameters for implementations
5. Think: "What code do I need?"

## Migration Guide

If you have an existing factory with code-in-parameters:

### Step 1: Identify the Problem
```yaml
# Current (bad)
props: string[]  # ["label: string", "count: number"]
```

### Step 2: Split into Data Points
```yaml
# New (good)
propNames: string[]   # ["label", "count"]
propTypes: string[]   # ["string", "number"]
```

### Step 3: Update Template
```handlebars
# Old
{{#each props}}
  {{this}};
{{/each}}

# New
{{#each propNames}}
  {{this}}: {{lookup ../propTypes @index}};
{{/each}}
```

### Step 4: Test Extraction
The extraction system should now work reliably!

## Summary

**Factory = Logic + Structure** (in template)  
**Parameters = Data** (configures the factory)

Keep parameters as pure data, never as code abstractions.
