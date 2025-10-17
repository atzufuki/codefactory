# Creating Your Own Factories

> Define code generators using Handlebars templates

## Overview

Factories are Handlebars templates that generate code. Create them manually or let AI help you design them.

## Quick Start

### 1. Create a Factory Manually

Create a `.hbs` file in your `factories/` directory:

**factories/typescript_function.hbs:**
```handlebars
---
name: typescript_function
description: Creates a TypeScript function
outputPath: src/{{functionName}}.ts
params:
  functionName:
    type: string
    required: true
  parameters:
    type: array
    required: false
  returnType:
    type: string
    required: false
---
export function {{functionName}}({{#each parameters}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}){{#if returnType}}: {{returnType}}{{/if}} {
  // TODO: Implement function
}
```

### 2. Use Your Factory

```bash
/codefactory.create factory="typescript_function" functionName="calculateTotal" returnType="number"
# → Creates src/calculateTotal.ts

# Edit the file directly, then:
/codefactory.sync "src/calculateTotal.ts"
# → Extracts your changes and regenerates
```

---

## Example: React Component Factory

**Create the factory file:**

**factories/react_component.hbs:**
```handlebars
---
name: react_component
description: Creates a React functional component
outputPath: src/components/{{componentName}}.tsx
params:
  componentName:
    type: string
    description: Name of the component
    required: true
  props:
    type: array
    description: Component props
    required: false
---
export interface {{componentName}}Props {
  {{#each props}}
  {{this}};
  {{/each}}
}

export function {{componentName}}(props: {{componentName}}Props) {
  return <div>Hello from {{componentName}}</div>;
}
```

**Use the factory:**

```bash
/codefactory.create factory="react_component" componentName="UserCard" props="name: string, email: string"
```

Result: `src/components/UserCard.tsx` created!

---

## How Factories Work

Factories are **Handlebars templates** with **frontmatter metadata**.

**Template Structure:**
1. **Frontmatter** (YAML between `---`): Defines name, params, output path
2. **Template Body** (Handlebars): Generates the actual code

**Automatic Discovery:**
- Place `.hbs` files in `factories/` directory
- System auto-discovers and registers them
- No manual registration needed!

### What Gets Generated

When you use a factory, the template generates code with markers:

```handlebars
---
name: react_component
description: Creates a React functional component
outputPath: src/components/{{componentName}}.tsx
params:
  componentName:
    type: string
    description: Name of the component
    required: true
  props:
    type: array
    description: Component props
    required: false
---
export interface {{componentName}}Props {
  {{#each props}}
  {{this}};
  {{/each}}
}

export function {{componentName}}(props: {{componentName}}Props) {
  return <div>Component content here</div>;
}
```

**This template is automatically discovered and registered!** No imports or configuration needed.

## Template Syntax Quick Reference

Factories use Handlebars templates. Here are the basics:

**Variables**: `{{variableName}}`
**Conditionals**: `{{#if var}}...{{/if}}`
**Loops**: `{{#each array}}...{{/each}}`
**No escaping**: `{{{variable}}}` (for HTML/special chars)

**Example**:
```handlebars
export function {{functionName}}({{#each params}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}) {
  {{#if hasReturn}}
  return {{returnValue}};
  {{/if}}
}
```

For full syntax, see [Handlebars documentation](https://handlebarsjs.com/).

---

## Tips

1. **Keep templates simple** - Complex logic belongs in your code edits, not templates
2. **Use descriptive variable names** - `{{componentName}}` not `{{name}}`
3. **Test immediately** - Use `/codefactory.create` to test your factory right away
4. **Iterate with sync** - Edit generated code, then `/codefactory.sync` to verify extraction works

---

## Advanced: Factory Requirements

For factories to work with the extraction system, they must:

1. **Be `.hbs` files** - Handlebars template format
2. **Have frontmatter** - YAML metadata between `---`
3. **Use supported patterns** - Simple variables, loops (no complex conditionals)

For complex generation logic, write the template to generate a simple structure, then edit the code manually.

---

## Next Steps

- Learn about [Extraction System](./extraction-system.md) workflow
- Set up [MCP Integration](./mcp-setup.md) for GitHub Copilot
- Explore [Template Frontmatter](./template-frontmatter.md) syntax

