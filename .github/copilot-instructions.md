# AI Code Factory - Copilot Instructions

## Project Overview

**Purpose:** Metadata-based code generation library for Deno 2 + TypeScript

**Key Concept:** Your code is the source of truth. JSDoc metadata tracks factory info. Edit freely, system extracts changes and regenerates files.

## Architecture

### Core Components

**Factory Registry** (`src/codefactory/registry.ts`)
- Auto-discovers `.hbs` template files from `factories/` directory
- Manages all available factories

**Template Loader** (`src/codefactory/template-loader.ts`)
- Loads Handlebars templates with YAML frontmatter
- Compiles templates into executable factories

**Producer** (`src/codefactory/producer.ts`)
- Creates files from factories (`createFile`)
- Syncs edited files with factories (`syncFile`, `syncAll`)
- Manages metadata-based regeneration

**Metadata** (`src/codefactory/metadata.ts`)
- Extracts JSDoc metadata from files
- Generates JSDoc metadata blocks
- Tracks factory name and parameters

**MCP Server** (`src/mcp-server/`)
- Exposes `codefactory_create` and `codefactory_sync` tools
- Enables AI assistants to use factories directly

## Workflow

### 1. Create
```typescript
producer.createFile("react_component", {
  componentName: "Button",
  props: ["label: string"]
}, "src/components/Button.tsx");
```

Generates:
```typescript
/**
 * @codefactory react_component
 * componentName: Button
 * props:
 *   - label: string
 */

export function Button(props: ButtonProps) { ... }
```

### 2. Edit
User edits the code directly:
- Rename functions
- Add properties
- Change logic
- Add custom code anywhere

### 3. Sync
```typescript
producer.syncFile("src/components/Button.tsx");
// or
producer.syncAll("src/components");
```

System:
1. Extracts parameters from edited code
2. Regenerates entire file with extracted params
3. Metadata updated automatically

## Factory Templates

Located in `factories/*.hbs` with YAML frontmatter:

```handlebars
---
name: react_component
description: Creates a React component
outputPath: src/components/{{componentName}}.tsx
params:
  componentName:
    type: string
    description: Name of the component
    required: true
  props:
    type: array
    description: List of props
    required: false
---
/**
 * @codefactory react_component
 * componentName: {{componentName}}
 * props: {{props}}
 */

export function {{componentName}}(props: {{componentName}}Props) {
{{#each props}}
  {{this}};
{{/each}}
}
```

**Important:** 
- Factory templates use YAML frontmatter (between `---` markers)
- Generated code includes JSDoc `@codefactory` metadata
- The factory template itself does NOT have JSDoc metadata at the top

## GitHub Copilot Integration

### Slash Commands
- `/codefactory.create` - Create new file from factory
- `/codefactory.sync` - Sync edited files

### Natural Language
- "Create a Button component" → Uses create
- "Sync my changes" → Uses sync
- AI translates to appropriate tool calls

## MCP Tools

**codefactory_create**
- Input: factory name, parameters, output path
- Output: Generated file with JSDoc metadata
- Used by: GitHub Copilot, Claude Desktop

**codefactory_sync**
- Input: file path or directory
- Output: Synced files with extracted changes
- Used by: GitHub Copilot, Claude Desktop

## Metadata Format

**JSDoc metadata block:**
```typescript
/**
 * @codefactory factory_name
 * param1: value1
 * param2: value2
 */

// Generated code here
```

The metadata tracks which factory to use and current parameter values. Entire file is regenerated on sync.

## Development

**Tests:** 99 tests passing
```bash
deno task test          # Run all tests
deno task check         # Type checking
deno task lint          # Linting
deno task fmt           # Format code
```

## Key Design Principles

1. **Code as Source of Truth** - Edit code directly, not config files
2. **Automatic Extraction** - System understands your changes
3. **Metadata-Based Tracking** - JSDoc metadata identifies factory
4. **Factory Consistency** - Templates ensure uniform structure
5. **Bidirectional Sync** - Template ↔ Code ↔ Template

## File Structure

```
src/
├── codefactory/              # Core library
│   ├── factory.ts           # Factory class
│   ├── registry.ts          # Factory discovery
│   ├── template-loader.ts   # .hbs loader
  ├── producer.ts          # Code generation
  ├── metadata.ts          # JSDoc metadata handling
  ├── frontmatter.ts       # YAML/JSON parser
│   └── tests/               # Unit tests (67)
├── mcp-server/              # MCP integration
│   ├── server.ts            # MCP server
│   ├── tools/
│   │   ├── create.ts        # codefactory_create
│   │   └── sync.ts          # codefactory_sync
│   └── tests/               # MCP tests (29)
└── create/                  # Project scaffolding
    └── template/            # Template project

tests/
└── e2e/                     # E2E tests (5)

.github/
└── prompts/                 # Copilot commands
    ├── codefactory.create.prompt.md
    └── codefactory.sync.prompt.md
```

## For AI Assistants

**When user requests code generation:**

1. Use `/codefactory.create` or `codefactory_create` MCP tool
2. Generate file with JSDoc metadata
3. User edits code freely
4. Use `/codefactory.sync` or `codefactory_sync` to extract changes
5. System regenerates file with extracted parameters

**DO:**
- Encourage editing code directly
- Use sync after user edits
- Include JSDoc @codefactory metadata
- Explain metadata format

**DON'T:**
- Generate code without metadata
- Remove the @codefactory JSDoc block
- Touch the metadata manually (system manages it)

## Production Status

✅ Production Ready
- 99 tests passing (67 unit + 29 MCP + 5 E2E)
- Extraction system with 91.9% coverage
- MCP server for AI integration
- GitHub Copilot slash commands
- Template system with Handlebars

��� Next: JSR publication
