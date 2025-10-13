# CodeFactory Project - GitHub Copilot Instructions

This project uses **CodeFactory** for deterministic AI code generation through predefined factory templates.

## Project Overview

- **Language**: TypeScript (Deno 2)
- **Purpose**: Define reusable code generation templates that AI can execute consistently
- **Key Principle**: AI calls factories with parameters instead of writing code from scratch

## Available Factories

All factories are defined in the `factories/` directory. Use the `/codefactory.list` command to see available factories and their parameters.

## Directory Structure

```
factories/          # Code generation template definitions
  ├── index.ts     # Main registry - all factories exported here
  └── examples.ts  # Example factory definitions
src/               # Generated and custom application code
```

## Working with Factories

### Discovery
Use `/codefactory.list` to see all available factories with:
- Factory names
- Descriptions
- Required parameters
- Output paths

### Production
Use `/codefactory.produce <factory_name>` with parameters to generate code. The factory will:
1. Validate parameters
2. Apply template substitutions
3. Produce code to specified output path

### Creation
Use `/codefactory.produce define_factory` to create new factories. The `define_factory` is a built-in meta-factory that generates factory definitions from templates.

## Development Guidelines

### When User Requests Code Generation

1. **First**, check available factories with `/codefactory.list`
2. **If a matching factory exists**, use `/codefactory.use` instead of writing code manually
3. **If no factory exists**, consider:
   - Is this a one-time thing? → Write code directly
   - Will this pattern repeat? → Create a factory with `/codefactory.create`

### Factory Best Practices

- **Names**: Use snake_case (e.g., `api_endpoint`, `react_component`)
- **Parameters**: Define clear, required parameters with descriptions
- **Templates**: Use `{{variable}}` syntax for substitutions
- **Output Paths**: Can include `{{variables}}` for dynamic naming

### Example Workflow

User: "Create a REST API endpoint for users"

1. Check: `/codefactory.list` → Is there an `api_endpoint` factory?
2. If yes: `/codefactory.use api_endpoint` with parameters
3. If no: Consider creating one if this will be repeated

## Code Generation Philosophy

> **Deterministic over flexible**: Factories generate consistent code every time. This is a feature, not a limitation.

- ✅ Use factories for repeated patterns
- ✅ Keep factories simple and focused
- ✅ Document factory parameters clearly
- ⚠️ Don't create factories for one-off code
- ⚠️ Don't make factories too flexible (defeats the purpose)

## Commands Reference

All CodeFactory commands are available as slash commands:
- `/codefactory.list` - List all available factories (including `define_factory`)
- `/codefactory.produce <factory_name>` - Produce code using a factory

### Creating New Factories

To create a new factory, use the built-in meta-factory:

```
/codefactory.produce define_factory
```

This will guide you through creating a new factory definition. The `define_factory` is a special built-in factory that creates other factories - it's the "factory of factories"!

See `.github/prompts/` directory for command implementations.

## Technical Notes

- Factories are defined using `defineFactory()` from `@codefactory/core`
- Templates use Mustache-style `{{variable}}` placeholders
- All factories must be exported from `factories/index.ts` to be discoverable
- Factory registry provides `getCatalog()` for AI consumption

---

**Remember**: When in doubt, list factories first. Let factories handle repetitive patterns.
