# My CodeFactory Project

Extraction-based code generation where **your code is the source of truth**.

## Quick Start

### 1. Create from Factory

```bash
# Using CLI
codefactory create example_component \
  --params '{"componentName":"Button","hasProps":true}' \
  --output src/Button.ts

# OR using GitHub Copilot
# In Copilot Chat: "Create a Button component"
```

### 2. Edit Code Freely

The generated file is your source of truth. Edit it directly:

```typescript
// src/Button.ts
/**
 * @codefactory example_component
 * componentName: Button
 * hasProps: true
 */

export interface ButtonProps {
  label: string;        // You added this
  onClick?: () => void; // And this
}

export function Button(props: ButtonProps) {
  console.log('Clicked!'); // Your custom logic
  return <button>{props.label}</button>;
}

// Custom code below metadata (always preserved)
export const PrimaryButton = styled(Button);
```

### 3. Sync Changes

```bash
# Sync single file
codefactory sync src/Button.ts

# OR sync entire directory
codefactory sync src/

# System extracts your changes and regenerates factory section
```

## Workflow

```
CREATE → EDIT → SYNC
  ↓       ↓       ↓
Factory  Your   Extract &
generates code  regenerate
structure truth  structure
```

## CLI Commands

```bash
codefactory list                    # List available factories
codefactory create <factory> ...    # Create from factory
codefactory sync <path>             # Sync file/directory
codefactory validate                # Validate templates
```

## GitHub Copilot Integration

If using Copilot, you have slash commands:
- `/codefactory.create` - Create file from factory
- `/codefactory.sync` - Sync changes

Natural language also works:
- "Create a Button component"
- "Sync my changes"

## Creating Factories

Add `.hbs` files to `factories/`:

```handlebars
---
name: my_factory
description: What this creates
outputPath: src/{{name}}.ts
params:
  name:
    type: string
    required: true
---
export function {{name}}() {
  // Your template
}
```

See `factories/README.md` for more details.

## Learn More

- [CodeFactory Docs](https://github.com/atzufuki/codefactory)
- [Creating Factories](https://github.com/atzufuki/codefactory/blob/main/docs/creating-factories.md)
- [Extraction System](https://github.com/atzufuki/codefactory/blob/main/docs/extraction-system.md)

---

Built with [CodeFactory](https://github.com/atzufuki/codefactory) 🏭
