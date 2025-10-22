# /codefactory.create - Generate New File from Factory

## Purpose
Generate a new source file using a factory template. The generated code becomes the single source of truth.

## Usage

```
/codefactory.create "Button component with label and onClick props"
/codefactory.create "React hook for fetching user data"
/codefactory.create web_component componentName="Card" tagName="app-card"
```

## How It Works

### 1. Parse User Intent
- Determine which factory to use (e.g., "web_component", "react_component")
- Extract initial parameters from description
- Determine output file path

### 2. Call MCP Tool
This command should call the `codefactory_create` MCP tool with parsed parameters:

```json
{
  "name": "codefactory_create",
  "arguments": {
    "factory": "web_component",
    "params": {
      "componentName": "Button",
      "tagName": "app-button",
      "propNames": ["label", "onClick"],
      "propTypes": ["string", "() => void"],
      "signalNames": [],
      "signalTypes": [],
      "signalDefaults": []
    },
    "outputPath": "src/components/Button.ts"
  }
}
```

The MCP tool will:
1. Load the factory registry
2. Get the specified factory
3. Generate code using Producer.createFile()
4. Return success/error response

### 3. Generated File Structure
```typescript
// @codefactory:start factory="web_component"
import HTMLProps from '@html-props/core';
import { signal } from '@html-props/signals';

interface ButtonProps {
  label: string;
  onClick?: () => void;
}

class Button extends HTMLProps(HTMLElement)<ButtonProps>() {
  label: string;
  onClick?: () => void;

  render() {
    return new html.Button({ content: this.label });
  }
}

Button.define('app-button');

export default Button;
// @codefactory:end

// User can add custom code below markers (it will be preserved on sync)
```

## Key Features

### ✅ Marker Format
- Uses `factory="name"` in markers
- Factory name links to template for parameter extraction

### ✅ Single Source of Truth
- Parameters are stored IN the generated code
- Edit code directly, sync later

### ✅ Custom Code Preservation
- Code outside markers is always preserved
- Add custom exports, functions, etc. below markers
- Safe to edit and extend

## Parameter Inference

The command should intelligently infer parameters from natural language:

### Example 1: Web Component
```
User: /codefactory.create "Counter component with count signal"

Inferred:
  factory: "web_component"
  params:
    componentName: "Counter"
    tagName: "app-counter"
    propNames: []
    propTypes: []
    signalNames: ["count"]
    signalTypes: ["number"]
    signalDefaults: ["0"]
  outputPath: "src/components/Counter.ts"
```

### Example 2: Web Component with Props
```
User: /codefactory.create "Button component with label and disabled props"

Inferred:
  factory: "web_component"
  params:
    componentName: "Button"
    tagName: "app-button"
    propNames: ["label", "disabled"]
    propTypes: ["string", "boolean"]
    signalNames: []
    signalTypes: []
    signalDefaults: []
  outputPath: "src/components/Button.ts"
```

### Example 3: Explicit Parameters
```
User: /codefactory.create web_component componentName="Modal" signalNames="isOpen" signalTypes="boolean" signalDefaults="false"

Direct mapping:
  factory: "web_component"
  params:
    componentName: "Modal"
    tagName: "app-modal"
    propNames: []
    propTypes: []
    signalNames: ["isOpen"]
    signalTypes: ["boolean"]
    signalDefaults: ["false"]
  outputPath: "src/components/Modal.ts"
```

## Factory Discovery

Show available factories if user asks (call MCP tool with no arguments to list):

```json
{
  "name": "codefactory_create",
  "arguments": {}
}
```

This returns a list of available factories with descriptions.

## Error Handling

### File Already Exists
```
❌ Error: File src/components/Button.ts already exists

Options:
  1. Delete the file first
  2. Use a different output path
  3. Use /codefactory.sync to update existing file
```

### Factory Not Found
```
❌ Error: Factory "unknown_factory" not found

Available factories:
  - web_component - Create HTML Props web component
  - react_component - Create React functional component
  - factory - Meta-factory for creating new factories

Hint: Run /codefactory.create with factory name or description
```

### Missing Parameters
```
❌ Error: Required parameter "componentName" missing

Factory "web_component" requires:
  - componentName (string, required)
  - props (array, optional)
  - signals (array, optional)
  - tagName (string, optional)

Example: /codefactory.create web_component componentName="Button"
```

## Response Format

After successful creation:

```
✅ Created src/components/Button.ts

Factory: web_component
Parameters:
  componentName: "Button"
  tagName: "app-button"
  propNames: ["label", "onClick"]
  propTypes: ["string", "() => void"]
  signalNames: []
  signalTypes: []
  signalDefaults: []

📝 You can now:
  1. Edit the file directly (add signals, change props)
  2. Add custom code below // @codefactory:end marker
  3. Run /codefactory.sync to regenerate factory sections

💡 Your code is the source of truth
```

## Implementation Notes

1. **Always call the MCP tool** - Use `codefactory_create` MCP tool, don't write TypeScript code
2. **Parse user intent first** - Extract factory name and parameters from natural language
3. **Use new marker format** - Tool automatically uses `factory="name"` markers
4. **Show clear feedback** - Return tool response to user
5. **Handle errors gracefully** - MCP tool returns actionable error messages

## Next Steps After Creation

1. **Edit code directly** - Add signals, change props, etc.
2. **Add custom code** - Below markers, add exports, functions
3. **Run /codefactory.sync** - Regenerate factory sections
4. **Iterate** - Edit → Sync → Edit → Sync

## Workflow

```
1. /codefactory.create → Code generated with markers
2. Edit code directly
3. /codefactory.sync → Factory sections regenerated
4. Iterate: Edit → Sync → Edit → Sync
```

Much simpler! 🎉
