# Multi-Language Templates# Handlebars with Frontmatter Extension



VSCode extension for advanced syntax highlighting in template files that combine multiple languages in a single file.VSCode extension that provides syntax highlighting for `.hbs` files with:

- YAML/JSON frontmatter support

## Overview- Multi-language template content (TypeScript, Python, etc.)

- Handlebars syntax highlighting

This extension enables rich syntax highlighting for template files that contain:

- **YAML/JSON frontmatter** (metadata)## Features

- **Any programming language** (TypeScript, Python, JavaScript, etc.)

- **Handlebars templating syntax** (variables, helpers, control structures)- **Frontmatter Detection**: Automatically detects YAML (`---`) or JSON frontmatter

- **Multi-language Support**: Syntax highlighting for TypeScript, JavaScript, Python in template body

Perfect for code generation templates, factory systems, and meta-programming workflows.- **Handlebars Syntax**: Full Handlebars template syntax support



## Features## Installation



### 🎨 Multi-Language Support1. Copy this extension to `.vscode/extensions/` folder

- **Frontmatter**: YAML syntax highlighting between `---` delimiters2. Reload VSCode

- **Template Body**: Full TypeScript/Python/etc. syntax highlighting3. `.hbs` files will automatically use the new syntax highlighting

- **Handlebars Tags**: `{{variable}}`, `{{#if}}`, `{{#each}}` with proper scoping

- **Handlebars Comments**: `{{!-- comment --}}` recognized as comments## Usage



### 🔧 Smart Syntax DetectionCreate `.hbs` files with frontmatter:

The extension automatically detects and highlights:

- YAML frontmatter at any position in the file```handlebars

- Handlebars template tags embedded in code---

- Native language syntax (TypeScript by default, extensible to other languages)name: my_template

description: A template example

## Supported File TypesoutputPath: output/{{name}}.ts

---

- `.hbs` - Handlebars template filesimport { Something } from './module';

- `.handlebars` - Handlebars template files  

- `.template` - Generic template filesexport default class {{className}} {

  // Your TypeScript code here

## Example}

```

```handlebars

{{!-- Factory template with multi-language support --}}## Development

---

name: react_componentTo modify the syntax grammar, edit `syntaxes/hbs-frontmatter.tmLanguage.json`.

description: Generate a React component
outputPath: src/components/{{componentName}}.tsx
---
import React from 'react';

interface {{componentName}}Props {
{{#each props}}
  {{this}};
{{/each}}
}

export function {{componentName}}(props: {{componentName}}Props) {
  return <div>{{content}}</div>;
}
```

In this example:
- **Line 1**: Handlebars comment (gray)
- **Lines 2-5**: YAML frontmatter (YAML syntax colors)
- **Lines 6-16**: TypeScript code with Handlebars tags (full TS + Handlebars highlighting)

## Use Cases

- **Code Generation**: Template-based code factories
- **Meta-Programming**: Generate code from specifications
- **Documentation**: Literate programming with embedded code
- **Configuration**: Config files with embedded logic

## Installation

### For Development
1. Copy this extension to your `.vscode/extensions/` folder:
   ```bash
   cp -r multi-language-templates ~/.vscode/extensions/
   ```
2. Reload VSCode (`Ctrl+Shift+P` → "Developer: Reload Window")
3. `.hbs` and `.template` files will automatically use the new syntax highlighting

### Workspace Configuration
Add to your workspace `.vscode/settings.json`:
```json
{
  "files.associations": {
    "*.hbs": "multi-language-template",
    "*.template": "multi-language-template"
  }
}
```

## Development

### Grammar Structure
The syntax grammar is defined in `syntaxes/multi-language-template.tmLanguage.json` with three main pattern groups:

1. **Frontmatter Pattern**: Detects `---` delimiters and includes YAML grammar
2. **Handlebars Pattern**: Matches `{{...}}` tags and `{{!-- comments --}}`
3. **Language Pattern**: Includes TypeScript (extensible to other languages)

### Extending Language Support

To add support for other languages (e.g., Python), modify the grammar:

```json
{
  "python-with-handlebars": {
    "patterns": [
      { "include": "#handlebars-comment" },
      { "include": "#handlebars-tag" },
      { "include": "source.python" }
    ]
  }
}
```

### Testing Changes
1. Edit `syntaxes/multi-language-template.tmLanguage.json`
2. Copy to extensions folder: `cp syntaxes/* ~/.vscode/extensions/multi-language-templates/syntaxes/`
3. Reload VSCode

## Architecture

This extension is part of the **AI Code Factory** project, designed to support:
- Deterministic code generation from templates
- Factory-based meta-programming
- AI-driven code creation with type safety

Learn more: [AI Code Factory Documentation](https://github.com/atzufuki/codefactory)

## License

MIT
