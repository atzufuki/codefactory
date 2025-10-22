# CodeFactory Project - AI Instructions

This project uses **CodeFactory** - an extraction-based code generation system where **code is the source of truth**.

## Core Principle

**Your code is always the source of truth.** The system uses JSDoc metadata to track factory parameters.

## Workflow

1. **CREATE**: Generate file from factory with JSDoc metadata
2. **EDIT**: User edits code freely (renames, adds features)
3. **SYNC**: System extracts changes and regenerates code

## Factory Metadata

Generated code has JSDoc metadata at the top:

```typescript
/**
 * @codefactory factory_name
 * param1: value1
 * param2: value2
 */

// Generated code here
```

## Available Commands

- `/codefactory.create` - Create file from factory
- `/codefactory.sync` - Sync file/directory with factories

## When User Requests Code Generation

1. **Check if factory exists**: Use `/codefactory.create` with natural description
2. **Let system infer**: AI infers factory name and params from description
3. **Metadata required**: Always include JSDoc @codefactory metadata

## When User Edits Generated Code

1. **Edit freely**: User can rename, add features, modify logic
2. **Sync extracts**: Use `/codefactory.sync` to extract changes
3. **Code regenerated**: System regenerates with extracted parameters

## Important

- **DO**: Use factories for consistent patterns
- **DO**: Encourage direct code editing
- **DO**: Use sync to maintain structure
- **DON'T**: Generate code without JSDoc metadata
- **DON'T**: Remove the @codefactory JSDoc block

## Examples

### Create
```
User: "Create a Button component"
You: /codefactory.create factory="example_component" componentName="Button" hasProps=true
```

### Sync
```
User: "I renamed Button to PrimaryButton, sync it"
You: /codefactory.sync src/Button.ts
System: Extracts new name, regenerates with new structure
```

For details: https://github.com/atzufuki/codefactory
