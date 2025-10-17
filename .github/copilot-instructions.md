# AI Code Factory - Copilot Instructions

## Project Overview

**Purpose:** Extraction-based code generation library for Deno 2 + TypeScript

**Key Concept:** Your code is the source of truth. Edit freely, system extracts changes and maintains factory structure.

## Architecture

### Core Components

**Factory Registry** (`src/codefactory/registry.ts`)
- Auto-discovers `.hbs` template files from `factories/` directory
- Manages all available factories

**Template Loader** (`src/codefactory/template-loader.ts`)
- Loads Handlebars templates with YAML frontmatter
- Compiles templates into executable factories

**Extractor** (`src/codefactory/extractor.ts`)
- Analyzes code to extract parameters
- Reverse-engineers template variables from source

**Producer** (`src/codefactory/producer.ts`)
- Creates files from factories (`createFile`)
- Syncs edited files with factories (`syncFile`, `syncAll`)
- Manages marker-based regeneration

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
// @codefactory:start factory="react_component"
export function Button(props: ButtonProps) { ... }
// @codefactory:end
```

### 2. Edit
User edits the code directly:
- Rename functions
- Add properties
- Change logic
- Add custom code outside markers

### 3. Sync
```typescript
producer.syncFile("src/components/Button.tsx");
// or
producer.syncAll("src/components");
```

System:
1. Extracts parameters from edited code
2. Regenerates factory section with extracted params
3. Preserves custom code outside markers

## Factory Templates

Located in `factories/*.hbs` with frontmatter:

```handlebars
---
name: react_component
description: Creates a React component
outputPath: src/components/{{componentName}}.tsx
---
export function {{componentName}}(props: {{componentName}}Props) {
{{#each props}}
  {{this}};
{{/each}}
}
```

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
- Output: Generated file with markers
- Used by: GitHub Copilot, Claude Desktop

**codefactory_sync**
- Input: file path or directory
- Output: Synced files with extracted changes
- Used by: GitHub Copilot, Claude Desktop

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

## Development

**Tests:** 99 tests passing
```bash
deno task test          # Run all tests
deno task check         # Type checking
deno task lint          # Linting
deno task fmt           # Format code
```

**Coverage:** 91.9% line coverage on extractor

## Key Design Principles

1. **Code as Source of Truth** - Edit code directly, not config files
2. **Automatic Extraction** - System understands your changes
3. **Marker-Based Safety** - Only regenerate marked sections
4. **Factory Consistency** - Templates ensure uniform structure
5. **Bidirectional Sync** - Template ↔ Code ↔ Template

## File Structure

```
src/
├── codefactory/              # Core library
│   ├── factory.ts           # Factory class
│   ├── registry.ts          # Factory discovery
│   ├── template-loader.ts   # .hbs loader
│   ├── extractor.ts         # Parameter extraction
│   ├── producer.ts          # Code generation
│   ├── frontmatter.ts       # YAML/JSON parser
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
2. Generate file with factory markers
3. User edits code freely
4. Use `/codefactory.sync` or `codefactory_sync` to extract changes
5. System maintains factory structure + user edits

**DO:**
- Encourage editing code directly
- Use sync after user edits
- Add custom code outside markers
- Explain marker boundaries

**DON'T:**
- Generate code without markers
- Modify base template structure inside markers
- Touch custom code outside markers

## Production Status

✅ Production Ready
- 99 tests passing (67 unit + 29 MCP + 5 E2E)
- Extraction system with 91.9% coverage
- MCP server for AI integration
- GitHub Copilot slash commands
- Template system with Handlebars

��� Next: JSR publication
