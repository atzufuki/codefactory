# CodeFactory Roadmap

## Current Status: Alpha

CodeFactory core is functional and includes GitHub Copilot integration. Not yet published to JSR.

---

## Phase 1: Core Foundation ✅ DONE

- [x] Factory class with template execution
- [x] FactoryRegistry for managing factories
- [x] Template engine with `{{variable}}` substitution
- [x] `defineFactory()` builder for easy factory creation
- [x] Meta-factory (`factory`) for creating factories
- [x] Built-in factories shipped with the library
- [x] Demo application showcasing usage
- [x] Create CLI tool (`create-codefactory`)
- [x] Project template with examples

## Phase 2: AI Integration ✅ DONE

### GitHub Copilot Slash Commands
- [x] GitHub Copilot slash commands via `.github/prompts/`
- [x] `/codefactory.create` - Create file from factory
- [x] `/codefactory.sync` - Sync edited files with factories
- [x] Natural language support through prompt files
- [x] Zero-installation integration (spec-kit pattern)

### MCP Server (Model Context Protocol)
- [x] MCP server implementation for AI assistant integration
- [x] 2 MCP tools (create, sync) for extraction-based workflow
- [x] AI inference for factory names and parameters
- [x] Type-safe tool schemas with validation
- [x] Support for GitHub Copilot Chat (VS Code 1.99+)
- [x] Support for Claude Desktop and other MCP clients
- [x] Comprehensive test coverage (82 tests total)
- [x] Environment variable configuration

## Phase 3: Auto-Registration & Discovery ✅ DONE

- [x] Automatic factory discovery from directory
- [x] Pattern-based factory registration
- [x] Exclude patterns for controlling discovery
- [x] Recursive directory scanning
- [x] Integration with FactoryRegistry
- [x] Comprehensive test coverage (37 tests)

## Phase 4: Extraction-Based System ✅ DONE

### Extraction Workflow
- [x] **Producer** - Create and sync files (230 lines, 21 tests)
  - Create files from factories with markers
  - Extract parameters from edited code
  - Sync changes back to factory structure
  - Recursive directory scanning
- [x] **Extractor** - Automatic parameter extraction (400+ lines, 11 tests)
  - Analyze Handlebars templates
  - Generate extraction patterns
  - Extract parameters from source code
  - Detect user modifications
- [x] **Marker System** - Safe regeneration
  - Wrap generated code in markers
  - Preserve user code outside markers
  - Support for factory-based markers
- [x] **AI Documentation** - Copilot integration guide
- [x] **Examples** - Complete workflow demonstrations

### Benefits
- ✅ Code as source of truth (edit code directly)
- ✅ Automatic parameter extraction (no manual config)
- ✅ Bidirectional sync (template ↔ code)
- ✅ Factory consistency (regenerate with extracted params)
- ✅ User code preservation (outside markers)

## Phase 5: JSR Publication 📋 PLANNED

### Packages to Publish

1. **@codefactory/core** - Core library
   - Factory and FactoryRegistry classes
   - Producer and Extractor
   - Template engine and loaders
   - Built-in factories
   - TypeScript types

2. **@codefactory/create** - Project scaffolding
   - CLI tool for creating projects
   - Project template with GitHub Copilot integration
   - Example factories and workflows

### Tasks

- [ ] Add JSR-specific metadata to `deno.json` files
- [ ] Test publishing to JSR (dry run)
- [ ] Publish @codefactory/core v0.1.0
- [ ] Publish @codefactory/create v0.1.0
- [ ] Update template imports to use JSR packages
- [ ] Test end-to-end: `deno run jsr:@codefactory/create my-app`

## Phase 6: Real-World Testing 📋 PLANNED

### Community Feedback
- [ ] Share with early adopters
- [ ] Gather feedback on API design
- [ ] Collect real factory examples from users
- [ ] Identify pain points and missing features

### Documentation
- [ ] Complete API documentation
- [ ] Video/GIF demonstrations of Copilot integration
- [ ] Factory authoring guide
- [ ] Best practices document
- [ ] Migration guide (if breaking changes needed)

### Examples
- [ ] React component factories
- [ ] REST API endpoint factories
- [ ] Test file generators
- [ ] Database schema factories
- [ ] CI/CD configuration factories

## Phase 7: Developer Tooling 🔧 IN PROGRESS

### VSCode Extension: Multi-Language Templates ✅ INITIAL RELEASE
- [x] **Extension Package** (`multi-language-templates`)
  - TextMate grammar for syntax highlighting
  - YAML frontmatter support (`---` delimiters)
  - Handlebars syntax (`{{variable}}`, `{{#each}}`, `{{#if}}`)
  - Handlebars comments (`{{!-- comment --}}`)
  - TypeScript code highlighting with Handlebars integration
  - Support for `.hbs`, `.handlebars`, `.template` files
- [x] **Local Development**
  - Language configuration (brackets, auto-closing)
  - Comprehensive README with examples
  - Grammar testing and validation
- [ ] **Publishing** (Phase 7a)
  - Extension icon/logo
  - CHANGELOG.md
  - VSCode Marketplace publication
  - Installation instructions
- [ ] **Multi-Language Support** (Phase 7b)
  - Python syntax support
  - JavaScript syntax support
  - JSON frontmatter (in addition to YAML)
  - Language auto-detection from frontmatter

**Related**: `.github/issues/vscode-extension-multi-language-templates.md`

### Future Tooling Enhancements
- [ ] IntelliSense for frontmatter fields
- [ ] Template validation (schema checking)
- [ ] Snippet support for common patterns
- [ ] Language Server Protocol (LSP) for advanced features

## Phase 8: Enhanced Features 🔮 FUTURE

### Extraction System Enhancements
- [ ] Incremental sync (only process changed files)
- [ ] Parallel processing of multiple files
- [ ] Extraction accuracy improvements
- [ ] Parameter validation rules
- [ ] Factory versioning and compatibility tracking
- [ ] Smart conflict resolution

### Factory Improvements
- [ ] Conditional logic in templates (`{{#if}}`)
- [ ] Loops in templates (`{{#each}}`)
- [ ] Factory composition (factories calling factories)
- [ ] Template inheritance/extension
- [ ] Validation rules for parameters
- [ ] Default parameter values

### Developer Experience
- [ ] Factory linter (validate factory definitions)
- [ ] Factory testing utilities
- [ ] Factory documentation generator
- [ ] Interactive factory creator (CLI wizard)
- [ ] Factory marketplace/catalog

### Integrations
- [ ] VS Code extension enhancements (Language Model Tools API)
  - Real-time validation
  - IntelliSense for factory names
  - Parameter auto-completion
  - Factory preview
- [ ] Support for other AI assistants (Claude, Cursor)
- [ ] GitHub Actions for factory validation
- [ ] Pre-commit hooks for factory testing

### Advanced Features
- [ ] Multi-file generation (one factory → multiple files)
- [ ] File modification (not just creation)
- [ ] Template hot-reload during development
- [ ] Factory versioning and compatibility
- [ ] Plugin system for custom template engines
- [ ] Factory analytics (which are most used?)

## Phase 9: Ecosystem 🌍 VISION

### Community
- [ ] Factory registry/marketplace
- [ ] Share and discover factories
- [ ] Factory collections by framework/language
- [ ] Community voting on best factories
- [ ] Factory of the Month showcase

### Enterprise Features
- [ ] Private factory registries
- [ ] Team factory sharing
- [ ] Factory governance and approval workflows
- [ ] Audit logs for factory usage
- [ ] Factory performance metrics

### Language Support
- [ ] Python factory runtime
- [ ] JavaScript/Node factory runtime
- [ ] Go factory runtime
- [ ] Universal factory format (language-agnostic)

---

## Contributing

Ideas for the roadmap? Open an issue or PR!

**Priority areas:**
1. Real-world factory examples
2. Documentation and tutorials
3. Bug reports from actual usage
4. Performance optimizations

## Version Strategy

- **v0.x** - Alpha/Beta, API may change
- **v1.0** - Stable API, production-ready
- **v1.x** - Minor features, backward compatible
- **v2.0+** - Major features, possible breaking changes

## Stay Updated

- Watch this repo for releases
- Check GitHub Issues for discussions
- Follow the changelog in releases

---

**Current Status**: Phase 7 In Progress (Developer Tooling)
**Current Focus**: VSCode Extension Development
**Next Milestone**: Extension Publication + JSR v0.1.0
**Target**: Complete developer experience with tooling

## Recent Achievements

- 🎨 **VSCode Extension** - Multi-language template syntax highlighting (v0.1.0)
  - YAML frontmatter + TypeScript + Handlebars in single file
  - TextMate grammar with smart pattern detection
  - Support for `.hbs`, `.template` files
- ✨ **82 tests passing** across all modules (core + MCP server + E2E)
- 🔌 **MCP Server** - Model Context Protocol integration for AI assistants
- 🔄 **Extraction System** - Automatic parameter extraction from edited code
- 🔍 **Auto-Registration** - Automatic factory discovery
- 🎨 **Template System** - YAML/JSON frontmatter support with Handlebars
- 📝 **Marker-Based Generation** - Safe code regeneration with user code preservation
- 🤖 **AI Integration** - GitHub Copilot slash commands + MCP tools
- 🐛 **Bug Fixes** - HTML encoding, params merge, empty params handling
