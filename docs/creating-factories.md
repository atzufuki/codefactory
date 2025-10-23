# Creating Your Own Factories

> Define code generators using Handlebars templates

## Overview

Factories are Handlebars templates that generate code. Create them manually or let AI help you design them.

## Quick Start

### 1. Create a Factory Manually

Create a `.codefactory` file in your `factories/` directory:

**factories/typescript_function.codefactory:**
```yaml
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

template: |
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

**factories/react_component.codefactory:**
```yaml
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

template: |
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

Factories are **YAML files** with **Handlebars templates**.

**File Structure (.codefactory):**
1. **YAML Metadata**: Defines name, params, output path
2. **template:** field (with `|` literal block): Contains the Handlebars template

**Automatic Discovery:**
- Place `.codefactory` files anywhere in your workspace
- System auto-discovers with `**/*.codefactory` glob pattern
- No manual registration needed!

### What Gets Generated

When you use a factory, the system generates code with JSDoc metadata:

```typescript
/**
 * @codefactory react_component
 * componentName: UserCard
 * props:
 *   - name: string
 *   - email: string
 */
export interface UserCardProps {
  name: string;
  email: string;
}

export function UserCard(props: UserCardProps) {
  return <div>Component content here</div>;
}
```

**Note:** The JSDoc metadata comment is **automatically added** by the Producer when creating files. Your factory templates should only contain the actual code to generate, not the metadata comment.

**Your `.codefactory` files are automatically discovered!** No imports or configuration needed.

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

1. **Be `.codefactory` files** - YAML format with template field
2. **Have required fields** - `name`, `description`, and `template`
3. **Use Handlebars syntax** - In the `template:` field (literal block with `|`)
4. **Use supported patterns** - Simple variables, loops, conditionals

For complex generation logic, write the template to generate a simple structure, then edit the code manually.

---

## Next Steps

- Learn about [Extraction System](./extraction-system.md) workflow
- Set up [MCP Integration](./mcp-setup.md) for GitHub Copilot
- Explore [Template Frontmatter](./template-frontmatter.md) syntax

