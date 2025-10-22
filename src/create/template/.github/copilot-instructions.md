# CodeFactory Project - Copilot Instructions

This project uses **CodeFactory** for AI-powered code generation with an **extraction-based workflow**.

## Quick Overview

- **Language**: TypeScript (Deno 2)
- **Key Concept**: Your code is the source of truth (no config files)
- **Factories**: Template files in `factories/*.hbs`

## Workflow

### 1. Create
```
/codefactory.create "Button component with label prop"
```
Generates file with markers:
```typescript
// @codefactory:start factory="web_component"
class Button extends HTMLElement {
  label: string;
}
// @codefactory:end
```

### 2. Edit Code Directly
Users edit the generated code:
- Add properties, methods, signals
- Change values, types, names
- Add custom code below markers

### 3. Sync
```
/codefactory.sync
```
System extracts parameters from edited code and regenerates factory sections.

## Commands

- `/codefactory.create <description>` - Create new file from factory
- `/codefactory.sync [path]` - Sync edited files with factories

## Markers

**Factory-managed code:**
```typescript
// @codefactory:start factory="factory_name"
// ... regenerated on sync ...
// @codefactory:end
```

**Custom code (preserved):**
```typescript
// @codefactory:end

// Everything here is never touched
export const MyButton = styled(Button);
```

## Guidelines for AI Assistants

✅ **DO:**
- Use `/codefactory.create` to generate initial files
- Encourage users to edit code directly
- Use `/codefactory.sync` after edits
- Add custom code outside markers

❌ **DON'T:**
- Change base class or template structure inside markers
- Use non-standard patterns that break extraction
- Add custom methods inside markers

## Factory Templates

Located in `factories/*.hbs` with Handlebars syntax and **strict parameter validation**:

```handlebars
---
name: web_component
description: Creates a web component
params:
  componentName:
    type: string
    description: Component class name
  propNames:
    type: string[]
    description: Array of prop names only
  propTypes:
    type: string[]
    description: Array of prop types only
---
class {{componentName}} extends HTMLElement {
{{#each propNames}}
  {{this}}: {{lookup ../propTypes @index}};
{{/each}}
}
```

**Key principle**: Parameters must be primitive data (string, number, boolean, arrays of primitives), never code syntax like `"label: string"`. Separate name and type into different arrays.

## Benefits

- ✅ No config files - code is self-documenting
- ✅ Natural editing experience
- ✅ Git diffs show actual code
- ✅ Simpler mental model

---

**Built with Deno ��� and CodeFactory ���**
