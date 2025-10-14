# Creating Your Own Factories

> Use the `factory` factory to create new code generators

## TL;DR

Use Copilot to create factories. No code needed.

```bash
/codefactory.add "a 'factory' for TypeScript function with parameters and return type"
/codefactory.produce
# → Creates factories/typescript_function.hbs

# Now use your new factory:
/codefactory.add "a 'typescript_function' for calculateTotal"
/codefactory.produce
# → Creates src/calculateTotal.ts
```

That's it!

## Quick Start

### 1. Create a Factory

```bash
/codefactory.add "a 'factory' for TypeScript function with parameters and return type"
/codefactory.produce
```

This generates `factories/typescript_function.hbs`.

### 2. Use Your Factory

```bash
/codefactory.add "a 'typescript_function' for calculateTotal with items array parameter"
/codefactory.produce
```

This generates `src/calculateTotal.ts` using your factory!

---

## Example: React Component Factory

**Step 1 - Create the factory**:

```bash
/codefactory.add "a 'factory' for functional React component with props interface and component body"
/codefactory.produce
```

Result: `factories/react_component.hbs` created.

**Step 2 - Use the factory**:

```bash
/codefactory.add "a 'react_component' for UserCard with name and email props"
/codefactory.produce
```

Result: `src/components/UserCard.tsx` created!

---

## How It Works

The `factory` is a **meta-factory** - it generates other factories.

**Input**: Natural language description  
**AI Does**: Infers template structure, variables, output path  
**Output**: Handlebars template file (`.hbs`) with frontmatter

### What Gets Generated

When you create a factory, you get a template file like this:

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
    required: true
---
export interface {{componentName}}Props {
  {{#each props}}
  {{this}};
  {{/each}}
}

export function {{componentName}}(props: {{componentName}}Props) {
  return <div>{{content}}</div>;
}
```

**This template is automatically discovered and registered!** No imports needed.

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

1. **Keep templates simple** - Complex logic belongs in separate factories
2. **Use descriptive variable names** - `{{componentName}}` not `{{name}}`
3. **Test with Copilot** - Let AI infer the structure first
4. **Iterate** - Run `/codefactory.produce` often to verify output

---

## Advanced: Manual Factory Creation

If you need to write factory code manually (for complex validation logic), see `docs/for-contributors.md`.

Most users should stick to Copilot commands!

---

**Next**: Learn about the [manifest system](./manifest-system.md) for project-wide builds.

