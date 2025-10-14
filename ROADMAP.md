# CodeFactory Roadmap

## Current Status: Alpha

CodeFactory core is functional and includes GitHub Copilot integration. Not yet published to JSR.

---

## Phase 1: Core Foundation ✅ DONE

- [x] Factory class with template execution
- [x] FactoryRegistry for managing factories
- [x] Template engine with `{{variable}}` substitution
- [x] `defineFactory()` builder for easy factory creation
- [x] Meta-factory (`define_factory`) for creating factories
- [x] Built-in factories shipped with the library
- [x] Demo application showcasing usage
- [x] Create CLI tool (`create-codefactory`)
- [x] Project template with examples

## Phase 2: AI Integration ✅ DONE

- [x] GitHub Copilot slash commands via `.github/prompts/`
- [x] `/codefactory.add` - Add factory call to manifest
- [x] `/codefactory.produce` - Build from manifest
- [x] `/codefactory.update` - Update factory call
- [x] `/codefactory.remove` - Remove factory call
- [x] `/codefactory.inspect` - Show manifest contents
- [x] Natural language support through prompt files
- [x] Zero-installation integration (spec-kit pattern)

## Phase 3: Auto-Registration & Discovery ✅ DONE

- [x] Automatic factory discovery from directory
- [x] Pattern-based factory registration
- [x] Exclude patterns for controlling discovery
- [x] Recursive directory scanning
- [x] Integration with FactoryRegistry
- [x] Comprehensive test coverage (37 tests)

## Phase 4: Build Manifest System ✅ DONE

### Two-Phase Code Generation
- [x] **ManifestManager** - Track factory calls in manifest (221 lines, 17 tests)
  - Add/remove/update factory calls
  - Dependency resolution with topological sort
  - Circular dependency detection
  - Save/load to disk
- [x] **Producer** - Execute factories from manifest (338 lines, 9 tests)
  - Build all or specific factory calls
  - Marker-based file generation
  - Dry-run preview mode
  - Error handling
- [x] **Marker System** - Safe regeneration
  - Always wrap generated code in markers
  - Preserve user code outside markers
  - Error if file exists without markers
- [x] **AI Documentation** - Copilot integration guide
- [x] **Examples** - Complete workflow demonstrations

### Benefits
- ✅ Deterministic builds (same manifest → same code)
- ✅ Fast rebuilding (no AI during build phase)
- ✅ Version control friendly (manifest in Git)
- ✅ Factory evolution (update factory → rebuild all)
- ✅ Dependency management (automatic execution order)

## Phase 5: JSR Publication 📋 PLANNED

### Packages to Publish

1. **@codefactory/core** - Core library
   - Factory and FactoryRegistry classes
   - ManifestManager and Producer
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

## Phase 7: Enhanced Features 🔮 FUTURE

### Manifest System Enhancements
- [ ] Incremental builds (only rebuild changed factories)
- [ ] Parallel execution (respecting dependencies)
- [ ] Manifest diff tool
- [ ] Factory call templates (reusable parameter sets)
- [ ] Factory versioning and compatibility tracking
- [ ] Migration tools for manifest format changes

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
- [ ] VS Code extension (Language Model Tools API)
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

## Phase 8: Ecosystem 🌍 VISION

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

**Current Status**: Phase 4 Complete (Build Manifest System)
**Current Focus**: JSR Publication (Phase 5)
**Next Milestone**: v0.1.0 on JSR
**Target**: Real-world testing with early adopters

## Recent Achievements

- ✨ **49 tests passing** across all modules
- 🏗️ **Build Manifest System** - Deterministic two-phase code generation
- 🔍 **Auto-Registration** - Automatic factory discovery
- 🎨 **Template System** - YAML/JSON frontmatter support
- 📝 **Marker-Based Generation** - Safe code regeneration
- 🤖 **AI Integration** - GitHub Copilot slash commands
