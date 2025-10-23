# AI Code Factory - Copilot Instructions

## Project Overview

Metadata-based code generation library that enables bidirectional sync between templates and code.

**Architecture:**
- Factories (contains a template + spec) generate code with JSDoc metadata blocks
- **Spec field** describes WHAT to generate (the first thing to consider)
- Metadata tracks factory name, parameters, and instance-specific spec
- Extraction system reads edited code and extracts current parameter values
- Regeneration uses extracted parameters to rebuild implementations from templates

**Core workflow:** Spec → Template → Generate → Edit → Extract → Regenerate

This enables users to edit generated code freely while maintaining template-based consistency.

## Specification System

**Factory-level spec** (general pattern):
```yaml
name: button_component
spec:
  description: Creates interactive button components
  references:
    - url: https://design.example.com/buttons
      title: Design System - Buttons
  aiGuidance: Check instance spec for specific button requirements
```

**Instance-level spec** (specific implementation):
```typescript
/**
 * @codefactory button_component
 * spec: https://myapp.com/specs/submit-button.md
 * componentName: SubmitButton
 */
```

**When creating factories or code:**
1. Check spec field FIRST
2. Factory spec = general pattern
3. Instance spec = specific requirements
4. Follow references (URLs, file paths)

## Where to Find Information

- **Implementation** → `src/codefactory/*.ts`
- **MCP tools** → `src/mcp-server/tools/*.ts`
- **CLI** → `src/cli/*.ts`
- **User docs** → `docs/*.md`
- **Examples** → `tests/` and `factories/`
- **Tasks** → `deno.json` (tasks section)

## When Developing

- Use `semantic_search` to find relevant code
- Read implementation files for details
- Check tests for usage patterns
