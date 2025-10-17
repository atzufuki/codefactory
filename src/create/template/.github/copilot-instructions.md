# CodeFactory Project - GitHub Copilot Instructions# CodeFactory Project - GitHub Copilot Instructions



This project uses **CodeFactory** for AI-powered code generation with an **extraction-based workflow**.This project uses **CodeFactory** for deterministic AI code generation with a two-phase workflow.



## Project Overview## Project Overview



- **Language**: TypeScript (Deno 2)- **Language**: TypeScript (Deno 2)

- **Purpose**: Define reusable code generation templates (factories) with code as the single source of truth- **Purpose**: Define reusable code generation templates (factories) and use a manifest system for reproducible builds

- **Key Concept**: Code contains all parameters - no separate manifest needed- **Key Concept**: AI creates "recipes" (manifest), then the system executes them deterministically



## Available Factories## Available Factories



All factories are defined in the `factories/` directory as `.hbs` (Handlebars) template files.All factories are defined in the `factories/` directory. Use the `/codefactory.inspect` command to see the manifest and available factories.



## Directory Structure## Directory Structure



``````

factories/                 # Code generation template definitionscodefactory.manifest.json  # Build manifest (like package.json)

  ├── index.ts            # Main registry - auto-discovers all factoriesfactories/                 # Code generation template definitions

  └── *.hbs               # Factory template files  ├── index.ts            # Main registry - all factories exported here

src/                      # Generated and custom application code  └── *.hbs               # Factory template files

.github/prompts/          # Copilot slash commandssrc/                      # Generated and custom application code

``````



## Extraction-Based Workflow## Two-Phase Workflow



### Core Principle: **Code is the Source of Truth**### Phase 1: Planning (with AI)

AI parses user intent and adds factory calls to `codefactory.manifest.json`:

Unlike traditional approaches where parameters are stored separately (in manifest files), CodeFactory extracts parameters directly from your source code.- Use natural language to describe what you want

- AI determines the right factory and parameters

### Workflow Steps:- Factory call is saved to manifest (not executed yet)



#### 1. Create (with AI)### Phase 2: Building (deterministic)

AI generates initial file with factory markers:Execute the manifest to generate code:

```bash- Read manifest file

/codefactory.create "Button component with label prop"- Execute all factory calls in dependency order

```- Generate code with markers for safe regeneration

- Same manifest → Always same output

Generates:

```typescript## Working with Factories

// @codefactory:start factory="web_component"

class Button extends HTMLProps(HTMLElement)<ButtonProps>() {### Slash Commands

  label: string;

  - **`/codefactory.add <description>`** - Add factory call to manifest (planning phase)

  render() {- **`/codefactory.produce`** - Build from manifest (execution phase, deterministic)

    return new html.Button({ content: this.label });- **`/codefactory.update <id> <params>`** - Update factory call in manifest

  }- **`/codefactory.remove <id>`** - Remove factory call from manifest

}- **`/codefactory.inspect`** - Show manifest contents and dependency graph

Button.define('app-button');

// @codefactory:end### Natural Language (Alternative Syntax)

```

- **"Add X to manifest"** → Uses `/codefactory.add` internally

#### 2. Edit (directly in code)- **"Build from manifest"** → Uses `/codefactory.produce`

User edits the file directly - add signals, change props, etc:- **"Update X in manifest"** → Uses `/codefactory.update`

```typescript- **"Remove X from manifest"** → Uses `/codefactory.remove`

// @codefactory:start factory="web_component"- **"Show manifest"** → Uses `/codefactory.inspect`

class Button extends HTMLProps(HTMLElement)<ButtonProps>() {

  label: string;## Development Guidelines

  onClick?: () => void;  // ← User added this

  ### When User Requests Code Generation

  // User added signals

  count = signal<number>(0);**Always use the two-phase manifest approach:**

  isDisabled = signal<boolean>(false);

  **Phase 1 - Planning:**

  render() {```

    return new html.Button({ content: this.label });User: "Add button component to manifest"

  }You: /codefactory.add "Create a button component"

}→ Adds factory call to codefactory.manifest.json

Button.define('my-button');  // ← User changed this→ Does NOT generate code yet

// @codefactory:end```



// User added custom code below (preserved on sync)**Phase 2 - Building:**

export const PrimaryButton = styled(Button);```

```User: "Build from manifest"

You: /codefactory.produce

#### 3. Sync (automatic parameter extraction)→ Reads manifest

System extracts parameters from edited code and regenerates:→ Executes all factory calls deterministically

```bash→ Generates code to files

/codefactory.sync```

```

### Factory Best Practices

Process:

1. Read source file- **Names**: Use snake_case (e.g., `api_endpoint`, `react_component`)

2. Extract factory name from marker: `factory="web_component"`- **Parameters**: Define clear, required parameters with descriptions

3. Load factory template- **Templates**: Use `{{variable}}` syntax for substitutions

4. **Extract parameters from code** using template patterns- **Output Paths**: Can include `{{variables}}` for dynamic naming

5. Regenerate factory section with extracted params- **Markers**: All generated code wrapped in `// @codefactory:start` ... `// @codefactory:end`

6. Replace only marked section

7. Preserve all custom code outside markers### Example Workflows



## Working with Factories**Adding multiple components:**

```

### Slash CommandsUser: "Add validateEmail function to manifest"

You: /codefactory.add "Create TypeScript function validateEmail with email: string parameter"

- **`/codefactory.create <description>`** - Create new file with factory

- **`/codefactory.sync [path]`** - Sync file(s) by extracting and regeneratingUser: "Add sanitizeInput function to manifest"

You: /codefactory.add "Create TypeScript function sanitizeInput with input: string parameter"

### Natural Language (Alternative Syntax)

User: "Build everything"

- **"Create a Button component"** → Uses `/codefactory.create`You: /codefactory.produce

- **"Sync my components"** → Uses `/codefactory.sync````



## Development Guidelines**Updating and rebuilding:**

```

### When User Requests Code GenerationUser: "Update validateEmail to return ValidationResult instead of boolean"

You: /codefactory.update validate-email-id returnType=ValidationResult

**Always use the extraction-based workflow:**

User: "Rebuild"

**Step 1 - Create:**You: /codefactory.produce

``````

User: "Create a Button component"

You: /codefactory.create "Button component with label and onClick props"## Code Generation Philosophy

→ Generates file with @codefactory markers

→ Code immediately usable> **"Same manifest, same code. Always."**

```

Two-phase approach separates concerns:

**Step 2 - User Edits:**- **Planning** (AI): Creative, flexible, understanding user intent

```- **Building** (deterministic): Fast, consistent, zero randomness

User edits the file directly in their IDE:

- Add signalsBenefits:

- Change props- ✅ Same manifest → Always same output

- Add custom methods below markers- ✅ Factory updates benefit all projects

```- ✅ Version control the "recipe" not the output

- ✅ Fast rebuilding without AI inference

**Step 3 - Sync:**- ✅ Team collaboration through shared manifest

```

User: "Sync the changes"## Commands Reference

You: /codefactory.sync

→ Extracts params from edited code### Slash Commands

→ Regenerates factory section

→ Preserves custom code- `/codefactory.add <description>` - Add factory call to manifest (AI parses intent)

```- `/codefactory.produce` - Build from manifest (deterministic, no AI)

- `/codefactory.update <id> <params>` - Update factory call parameters

### Factory Template Best Practices- `/codefactory.remove <id>` - Remove factory call from manifest

- `/codefactory.inspect` - Show manifest contents and dependency graph

- **Names**: Use snake_case (e.g., `web_component`, `api_endpoint`)

- **Parameters**: Use `{{variable}}` syntax for simple params### Natural Language Patterns

- **Loops**: Use `{{#each arrayName}}` for repeated elements

- **Markers**: All generated code wrapped in `// @codefactory:start factory="name"` ... `// @codefactory:end`- "Add [X] to manifest" → Uses `/codefactory.add`

- "Build from manifest" → Uses `/codefactory.produce`

### Code Editing Guidelines- "Update [X] in manifest" → Uses `/codefactory.update`

- "Remove [X] from manifest" → Uses `/codefactory.remove`

**✅ DO (Safe Edits Inside Markers):**- "Show manifest" → Uses `/codefactory.inspect`

- Add/remove signals: `count = signal<number>(0);`

- Change props in interface### Marker-Based File Management

- Modify parameter values (defaults, types, etc.)

- Change names (componentName, tagName, etc.)**CRITICAL**: All generated code is wrapped in markers:

```typescript

**✅ DO (Custom Code Outside Markers):**// @codefactory:start id="factory-call-id"

- Add helper functions// Generated code here

- Add exports// @codefactory:end

- Add styled components```

- Add anything custom

**Rules:**

**❌ DON'T (Will Break Extraction):**1. First generation: Create file with markers

- Change template structure (e.g., base class)2. Regeneration: Replace only content between markers

- Use non-standard patterns (e.g., `signal(0)` instead of `signal<number>(0)`)3. Error if file exists without markers (tell user to delete file or add markers)

- Add custom methods inside markers (move outside)4. Multiple factory outputs can coexist in same file with different IDs



### Example Workflows## Technical Notes



**Creating a component:**- **Factories**: Defined as `.hbs` template files with frontmatter metadata

```- **Templates**: Use Handlebars syntax with `{{variable}}` placeholders

User: "Create a Counter component with count signal"- **Registry**: All factories exported from `factories/index.ts` for auto-discovery

You: /codefactory.create "Counter component with count signal"- **Manifest**: `ManifestManager` handles factory call tracking and dependency resolution

→ File created: src/components/Counter.ts- **Producer**: Executes manifest deterministically with marker-based generation

→ User can edit immediately- **Markers**: `// @codefactory:start id="..."` ensures safe regeneration

```- **Meta-Factory**: Built-in `factory` factory creates new factories from templates



**After user edits:**## Common Patterns

```

User: "I added a step signal and changed the tag name to my-counter"### Creating a New Factory

You: /codefactory.sync src/components/Counter.ts

→ System extracts new parameters from codeUse the built-in meta-factory to create factories:

→ Regenerates factory section with changes

→ Custom code preserved```

```/codefactory.add "Create a factory for generating API endpoints"

→ Uses 'factory' factory to generate a new .hbs template

**Creating a new factory:**→ Define template structure, parameters, and output path

```→ New factory becomes available for use

User: "Create a factory for React hooks"```

You: /codefactory.create "factory for React custom hooks with state"

→ Creates factories/react_hook.hbs### Handlebars Template Syntax

→ User can use immediately: /codefactory.create "useCounter hook"

``````handlebars

---

## Key Benefitsname: my_factory

description: Brief description of what this factory generates

### vs. Manifest-Based ApproachoutputPath: src/{{fileName}}.ts

---

**OLD (Manifest):**// Template content with {{variable}} substitutions

```{{#if condition}}

1. Add to manifest.json  // Conditional content

2. Build from manifest{{/if}}

3. Edit manifest to update

4. Build again{{#each items}}

```  // Iterate over arrays

  {{this}}

**NEW (Extraction):**{{/each}}

``````

1. Create file

2. Edit code directly### Working with Props and Nested Objects

3. Sync

``````handlebars

{{#each props}}

**Advantages:**  {{this.name}}: {{this.type}};

- ✅ No separate manifest file to manage{{/each}}

- ✅ Code is self-documenting```

- ✅ Direct editing feels natural

- ✅ Git diffs show actual code changesWhen calling factory:

- ✅ Simpler mental model```json

{

## Marker System  "props": [

    {"name": "count", "type": "number"},

### New Format    {"name": "label", "type": "string"}

```typescript  ]

// @codefactory:start factory="web_component"}

// ... factory-managed code ...```

// @codefactory:end

## API Quick Reference

// User code here (always preserved)

``````typescript

import { ManifestManager, Producer, FactoryRegistry } from "@codefactory/core";

**Key points:**

- Marker includes factory name (enables parameter extraction)// Load/create manifest

- Only content between markers is regeneratedconst manager = await ManifestManager.load("./codefactory.manifest.json");

- Content outside markers is NEVER touched

- Safe to add custom code below markers// Add factory call

manager.addFactoryCall({

### Template Files  id: "my-component",

```handlebars  factory: "component_factory",

{{!-- factories/web_component.hbs --}}  params: { name: "MyComponent" },

  outputPath: "src/MyComponent.ts",

{{!-- @codefactory:start factory="factory" --}}});

---await manager.save();

name: web_component

description: Creates HTML Props web component// Build from manifest

params:const registry = new FactoryRegistry();

  componentName:await registry.autoRegister("./factories");

    type: stringconst producer = new Producer(manager.getManifest(), registry);

    required: trueawait producer.buildAll();

---```



class {{componentName}} extends HTMLProps(HTMLElement) {---

{{#each signals}}

  {{this.name}} = signal<{{this.type}}>({{this.default}});**Remember**: Prefer manifest-based workflow for projects. Use direct generation for quick prototyping.

{{/each}}

}## Common Issues and Solutions

{{!-- @codefactory:end --}}

```### Issue: "Factory not found in registry"

**Cause**: Factory .hbs file missing `name` or `description` in frontmatter  

## Common Patterns**Solution**: Ensure frontmatter has:

```yaml

### Adding Signals---

```typescriptname: factory_name

// User edits code:description: What this factory does

class Button ... {---

  count = signal<number>(0);```

  isOpen = signal<boolean>(false);  // ← Added

}### Issue: "File exists but has no marker"

**Cause**: Trying to regenerate into a file without CodeFactory markers  

// System extracts:**Solution**: Either delete the file, or add markers manually:

signals: [```typescript

  { name: "count", type: "number", default: "0" },// @codefactory:start id="your-factory-call-id"

  { name: "isOpen", type: "boolean", default: "false" }// existing code

]// @codefactory:end

``````



### Adding Props### Issue: Props not defined as class properties

```typescript**Cause**: Factory template doesn't duplicate props from interface  

// User edits code:**Solution**: Template should include props twice:

interface ButtonProps {```handlebars

  label: string;interface {{componentName}}Props {

  onClick?: () => void;  // ← Added{{#each props}}

}  {{this}};

{{/each}}

// System extracts:}

props: ["label: string", "onClick?: () => void"]

```class {{componentName}} {

{{#each props}}

### Custom Code  {{this}};  // Duplicate here for class properties

```typescript{{/each}}

// @codefactory:end}

```

// ✅ All of this is preserved on sync

export const PrimaryButton = styled(Button);### Issue: Template has HTML entity encoding (e.g., `=&gt;`)

export const DangerButton = styled(Button);**Cause**: Handlebars auto-escapes by default  

**Solution**: Use triple braces `{{{variable}}}` or set `noEscape: true` in factory metadata

export function useButton() {

  return new Button();### Issue: Inline imports (`jsr:`, `npm:`) not allowed

}**Cause**: Generated code uses inline specifiers instead of import map  

```**Solution**: Use bare specifiers and define in `deno.json` or `package.json`:

```json

## Troubleshooting{

  "imports": {

### "Factory not found"    "@mylib/core": "jsr:@mylib/core@^1.0"

```bash  }

# Available factories listed in error}

# Either use existing factory or create new one:```

/codefactory.create "factory for TypeScript functions"
```

### "No marker found"
```bash
# File not managed by codefactory
# Either:
# 1. Add markers manually
# 2. Recreate with /codefactory.create
```

### "Extraction failed"
```bash
# Code structure doesn't match template
# Either:
# 1. Fix code to match template pattern
# 2. Remove markers (make fully custom)
# 3. Update template to match code
```

## Tips for AI Assistants

1. **Prefer extraction workflow** - Don't mention manifests
2. **Guide users to edit code directly** - Not through commands
3. **Explain markers** - What's safe to edit, what's not
4. **Show sync benefits** - Emphasize bidirectional nature
5. **Use /codefactory.sync liberally** - After edits, template changes

---

**Built with Deno 🦕, CodeFactory 🏭, and Model Context Protocol 🔌**
