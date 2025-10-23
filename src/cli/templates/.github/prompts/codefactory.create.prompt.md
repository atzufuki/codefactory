---
description: Create a file from a CodeFactory factory template
---

# Instructions

**YOU MUST call the `codefactory_create` MCP tool. Do not generate code directly.**

## Step 1: Parse User Request

Extract from the user's request:
- Factory name (infer from description or use explicit name)
- Parameters (extract from description)
- Output path (infer from component name or ask)

## Step 2: Call MCP Tool

**REQUIRED:** Call `codefactory_create` with these arguments:

## Step 2: Call MCP Tool

**REQUIRED:** Call `codefactory_create` with these arguments:

```json
{
  "name": "codefactory_create",
  "arguments": {
    "factory": "example_component",
    "params": {
      "componentName": "Button",
      "hasProps": true
    },
    "outputPath": "src/Button.ts"
  }
}
```

**DO NOT:**
- Generate code yourself
- Write files directly
- Skip calling the tool

## Step 3: Return Tool Result

After the tool executes, explain to the user:
- What file was created
- What they can do next (edit code, then sync)

## Examples

### Example 1: Infer from Description
```
User: "Create a Button component"

YOU MUST:
1. Infer: factory="example_component", componentName="Button", hasProps=true
2. Call codefactory_create tool
3. Return result to user
```

### Example 2: Explicit Parameters
```
User: "/codefactory.create example_component componentName=Modal hasProps=false"

YOU MUST:
1. Parse: factory="example_component", componentName="Modal", hasProps=false
2. Call codefactory_create tool
3. Return result to user
```

## Error Handling

If the tool returns an error, explain it to the user and suggest fixes.

Common errors:
- File already exists → Suggest using /codefactory.sync instead
- Factory not found → List available factories
- Missing params → Show required parameters
