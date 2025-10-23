# CodeFactory Roadmap

## Current Status: Pilot Phase

A metadata-based code generation system. Ready for experimentation.

---

## ✅ Completed

### Core System
- Factory class with Handlebars templates and YAML/JSON frontmatter
- FactoryRegistry with auto-discovery from `factories/` directory
- Producer for creating and syncing files with JSDoc `@codefactory` metadata
- Meta-factory for creating new factories

### CLI Binary (Standalone)
- `codefactory init` - Initialize projects with template
- `codefactory create` - Generate files from factories
- `codefactory sync` - Smart context-aware sync (file/factory/directory)
- `codefactory list` - List available factories
- `codefactory validate` - Validate factory templates
- `codefactory mcp` - Start MCP server
- Embedded templates, MCP server, and core factories

### VS Code Extension
- Context-aware sync command (`Ctrl+Shift+S`)
- Syntax highlighting for `.hbs`/`.template` files
  - YAML/JSON frontmatter
  - Handlebars templating
  - Embedded TypeScript/Python/etc.
- Auto-activation on `.codefactory.json` detection

### MCP Server (Model Context Protocol)
- `codefactory_create` - Create files with AI inference
- `codefactory_sync` - Smart sync (handles factories/source/directories)
- Embedded in CLI binary (142KB)
- GitHub Copilot integration via MCP

---

## 🔮 Future Enhancements

### Advanced Features
- [ ] Multi-file generation from single factory
- [ ] Factory composition (factories calling factories)
- [ ] Conditional logic (`{{#if}}`) and loops (`{{#each}}`)
- [ ] Factory versioning and compatibility tracking

---

**Current Focus**: Testing and refinement  
**Status**: Pilot phase - ready for experimentation

## Recent Updates

- ✅ **Metadata System** - JSDoc-based parameter tracking
- ✅ **CLI Binary** - Standalone binary with all dependencies
- ✅ **VS Code Extension** - One-command sync with `Ctrl+Shift+S`
- ✅ **Smart Sync** - Auto-detects factories and syncs all dependent files
- ✅ **MCP Embedded** - Server runs from CLI binary
- ✅ **Factory Detection** - `.hbs`/`.template` files trigger mass sync
