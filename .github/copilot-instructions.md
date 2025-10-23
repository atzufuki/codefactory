# AI Code Factory - Copilot Instructions

## Project Overview

Metadata-based code generation library that enables bidirectional sync between templates and code.

**Architecture:**
- Factories (contains a template) generate code with JSDoc metadata blocks
- Metadata tracks factory name and parameters used for generation
- Extraction system reads edited code and extracts current parameter values
- Regeneration uses extracted parameters to rebuild implementations from templates

**Core workflow:** Template → Generate → Edit → Extract → Regenerate

This enables users to edit generated code freely while maintaining template-based consistency.

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
