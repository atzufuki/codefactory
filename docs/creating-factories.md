# Creating Your Own Factories

> Define code generators using Handlebars templates with specifications

## Overview

Factories are Handlebars templates that generate code. They can include **specifications** that guide AI and developers in understanding WHAT to generate. Create them manually or let AI help you design them.

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
spec: |
  Creates React functional components following modern best practices.
  Uses TypeScript for type safety and proper prop interfaces.
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
  spec:
    type: string
    description: Specific component specification or design link
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

---

## Specification Field (`spec`)

The `spec` field is **the first thing AI should consider** when creating code from your factory. It describes WHAT to generate, not HOW.

### Simple Inline Spec

```yaml
name: button_component
description: Creates a button component
spec: Interactive button component with standard styling and behavior
```

### Structured Spec with References

```yaml
name: button_component
description: Creates interactive button web component
spec:
  description: |
    Implements button component with standard variants and states.
    Supports primary, secondary, outline, and text variants.
    
  files:
    - path: specs/components/button.md
      description: Complete button component specification
    - path: specs/accessibility.md
      description: Accessibility requirements and ARIA patterns
      
  references:
    - url: https://design.example.com/components/buttons
      title: Design System - Button Guidelines
    - url: https://www.w3.org/WAI/ARIA/apg/patterns/button/
      title: WAI-ARIA Button Pattern
      
  aiGuidance: |
    When creating button instances:
    1. Check the instance 'spec' parameter for specific requirements
    2. Follow design tokens from references
    3. Ensure proper accessibility (ARIA labels, keyboard support)
    4. Use consistent interaction patterns
```

### Instance-Specific Specs

Factories have a **general spec**, but generated files can have **instance-specific specs**:

```yaml
# Factory spec (general)
name: button_component
spec:
  description: General button component implementation
  references:
    - url: https://design.example.com/buttons
    
params:
  componentName:
    type: string
    required: true
  spec:  # ← Instance spec parameter!
    type: string
    description: Specific spec for this button instance
    required: false
```

When you create a file:

```typescript
/**
 * @codefactory button_component
 * spec: https://myapp.com/specs/submit-button.md  ← Instance spec
 * componentName: SubmitButton
 * variant: primary
 */
export class SubmitButton extends HTMLElement {
  // implementation
}
```

**Why two levels?**
- **Factory spec**: Describes the general pattern (e.g., "all button components")
- **Instance spec**: Describes this specific button (e.g., "submit button with validation feedback")

### Best Practices

1. **Use file references** for complex specifications:
   ```yaml
   spec:
     files:
       - path: specs/components/button.md
   ```

2. **Link to authoritative sources**:
   ```yaml
   spec:
     references:
       - url: https://design.example.com/...
         title: Official Design System Spec
   ```

3. **Provide AI guidance** on how to use the spec:
   ```yaml
   spec:
     aiGuidance: |
       Check instance spec first, then follow general guidelines
   ```

4. **Keep it simple** if you don't need complexity:
   ```yaml
   spec: Implement following REST API best practices
   ```

---

## Tips

1. **Start with spec** - Define WHAT before HOW (use `spec` field)
2. **Keep templates simple** - Complex logic belongs in your code edits, not templates
3. **Use descriptive variable names** - `{{componentName}}` not `{{name}}`
4. **Test immediately** - Use `/codefactory.create` to test your factory right away
5. **Iterate with sync** - Edit generated code, then `/codefactory.sync` to verify extraction works
6. **Reference external specs** - Link to design systems, API docs, or RFC documents

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

