# Build Manifest System - Factory Recipe for Deterministic Code Generation

## Status
**Proposed** - Not yet implemented

## Problem Statement

Currently, when AI uses `/codefactory.produce` to generate code:
1. Factory is called with parameters
2. Code is immediately generated and written to files
3. Parameters are lost after generation
4. No way to regenerate the entire project
5. If a factory definition changes, previously generated code cannot be updated

This creates several issues:
- **Non-deterministic**: Cannot reproduce the exact same project structure
- **No versioning**: Cannot track what was generated, when, and with what parameters
- **No rebuilding**: When factories improve, old generated code doesn't benefit
- **AI dependency at runtime**: Would need AI to re-parse parameters for regeneration
- **Slow regeneration**: AI inference adds latency to rebuild process

## Solution: Build Manifest / Factory Recipe

Introduce a **two-phase approach**:

### Phase 1: Planning (with AI)
- AI parses user intent and determines factory + parameters
- Factory call is **added to manifest** (not executed yet)
- Manifest serves as the "recipe" or "blueprint" for the project

### Phase 2: Building (deterministic, no AI)
- Read `codefactory.manifest.json`
- Execute all factories in dependency order
- Generate code to files
- Fast, deterministic, reproducible

## Architecture

### Manifest File Structure

```json
{
  "version": "1.0.0",
  "generated": "2025-10-13T10:30:00Z",
  "factories": [
    {
      "id": "user-list-component",
      "factory": "react_component",
      "params": {
        "componentName": "UserList",
        "props": ["users: User[]"],
        "stateVars": []
      },
      "outputPath": "src/components/UserList.tsx",
      "createdAt": "2025-10-13T10:30:00Z",
      "factoryVersion": "1.2.0"
    },
    {
      "id": "user-api-endpoint",
      "factory": "api_endpoint",
      "params": {
        "path": "/api/users",
        "method": "GET",
        "handler": "getUsers"
      },
      "outputPath": "src/api/users.ts",
      "createdAt": "2025-10-13T10:31:00Z",
      "factoryVersion": "1.0.0",
      "dependsOn": ["user-list-component"]
    }
  ]
}
```

### Core Components

#### 1. ManifestManager
```typescript
export interface FactoryCall {
  id: string;                    // Unique identifier for this call
  factory: string;               // Factory name
  params: Record<string, any>;   // Parameters (JSON-serializable)
  outputPath: string;            // Where code will be generated
  createdAt: string;             // ISO timestamp
  factoryVersion?: string;       // Factory version used
  dependsOn?: string[];          // IDs of other factory calls this depends on
}

export interface BuildManifest {
  version: string;               // Manifest format version
  generated: string;             // Last build timestamp
  factories: FactoryCall[];      // All factory calls in this project
}

export class ManifestManager {
  // Add new factory call to manifest
  addFactoryCall(call: FactoryCall): void;
  
  // Remove factory call by ID
  removeFactoryCall(id: string): void;
  
  // Update existing factory call
  updateFactoryCall(id: string, updates: Partial<FactoryCall>): void;
  
  // Get execution order based on dependencies
  getExecutionOrder(): FactoryCall[];
  
  // Save manifest to disk
  save(): Promise<void>;
  
  // Load manifest from disk
  static load(path: string): Promise<ManifestManager>;
}
```

#### 2. Builder
```typescript
export class Builder {
  constructor(
    private manifest: BuildManifest,
    private registry: FactoryRegistry
  ) {}
  
  // Build entire project from manifest
  async buildAll(): Promise<BuildResult>;
  
  // Build specific factory calls
  async build(ids: string[]): Promise<BuildResult>;
  
  // Check what would change without actually building
  async dryRun(): Promise<BuildPreview>;
}

export interface BuildResult {
  success: boolean;
  generated: string[];           // Files that were generated
  errors: BuildError[];          // Any errors encountered
  duration: number;              // Build time in ms
}
```

## New Workflow

### 1. Add to Manifest (with AI)
```
User: "Create a user list component with UserList name"
AI: 
  → Parses intent
  → Determines factory: react_component
  → Extracts params: {componentName: "UserList", ...}
  → Calls ManifestManager.addFactoryCall()
  → Response: "Added 'user-list-component' to manifest. Run build to generate."
```

### 2. Build Project (no AI, deterministic)
```bash
deno task codefactory build
```
→ Reads `codefactory.manifest.json`
→ Resolves dependency order
→ Executes each factory with saved parameters
→ Writes generated code to files
→ Updates `generated` timestamp

### 3. Update Factory Call
```
User: /codefactory.update user-list-component props=["users: User[]", "onSelect: (id: string) => void"]
AI:
  → Updates manifest with new params
  → Response: "Updated manifest. Run build to regenerate."
```

### 4. Rebuild Everything
```bash
deno task codefactory rebuild
```
→ Same as build, but forces regeneration even if files exist
→ Useful when factory definitions have changed

## GitHub Copilot Integration

### Updated Commands

#### `/codefactory.produce` (modified)
- AI parses user intent
- Adds factory call to manifest
- **Does NOT generate code immediately**
- Shows preview of what will be added
- User can confirm or modify before building

#### `/codefactory.build` (new)
- Reads manifest
- Executes all pending factory calls
- Shows progress and results
- No AI inference needed

#### `/codefactory.update` (new)
- Modify existing factory call parameters
- Updates manifest
- Prompts user to rebuild

#### `/codefactory.remove` (new)
- Remove factory call from manifest
- Optionally delete generated files

#### `/codefactory.inspect` (new)
- Show manifest contents
- Highlight what has been generated vs pending
- Show dependency graph

## Benefits

### ✅ Deterministic
- Same manifest → Always same output
- No AI randomness during build phase
- Reproducible across machines and time

### ✅ Fast Rebuilding
- No AI inference during build
- Pure factory execution
- Can be parallelized (respecting dependencies)

### ✅ Version Control
- `codefactory.manifest.json` goes in Git
- Team shares exact project structure
- Code review the "recipe" not the generated code

### ✅ Factory Evolution
- Update factory definition
- Run rebuild
- All generated code uses new factory version
- Like updating a dependency

### ✅ Dependency Management
- Factories can reference other generated code
- Execution order automatically determined
- Avoid race conditions

### ✅ Audit Trail
- See what was generated, when, and why
- Track parameter changes over time
- Understand project structure at a glance

### ✅ Incremental Development
- Add factory calls one at a time
- Build when ready
- Mix manual code with generated code

## Analogies

| System | Manifest | Build |
|--------|----------|-------|
| **Docker** | Dockerfile | `docker build` |
| **Kubernetes** | YAML manifests | `kubectl apply` |
| **Terraform** | `.tf` files | `terraform apply` |
| **Makefile** | Makefile rules | `make` |
| **CodeFactory** | `codefactory.manifest.json` | `deno task codefactory build` |

## Implementation Plan

### Phase 1: Core Infrastructure
- [ ] Create `src/codefactory/manifest.ts` - ManifestManager class
- [ ] Create `src/codefactory/builder.ts` - Builder class
- [ ] Add manifest file format types
- [ ] Implement dependency resolution algorithm

### Phase 2: CLI Integration
- [ ] Add `build` command to CLI
- [ ] Add `rebuild` command
- [ ] Add `inspect` command for manifest visualization
- [ ] Update template project with empty manifest

### Phase 3: Copilot Integration
- [ ] Modify `codefactory.produce.prompt.md` - add to manifest instead of direct generation
- [ ] Create `codefactory.build.prompt.md` - build from manifest
- [ ] Create `codefactory.update.prompt.md` - update manifest entries
- [ ] Create `codefactory.remove.prompt.md` - remove from manifest
- [ ] Create `codefactory.inspect.prompt.md` - visualize manifest

### Phase 4: Advanced Features
- [ ] Incremental builds (only rebuild changed factories)
- [ ] Parallel execution (respecting dependencies)
- [ ] Watch mode (`codefactory build --watch`)
- [ ] Dry-run mode to preview changes
- [ ] Manifest diff tool
- [ ] Factory call templates (reusable parameter sets)

### Phase 5: Documentation & Testing
- [ ] Update README with new workflow
- [ ] Create migration guide for existing projects
- [ ] Add examples to template project
- [ ] Write integration tests
- [ ] Create demo video

## Migration Path

### For Existing Projects
```bash
# 1. Initialize manifest from existing generated code
deno task codefactory init

# 2. Review generated manifest
deno task codefactory inspect

# 3. Make adjustments if needed
# Edit codefactory.manifest.json

# 4. Test rebuild
deno task codefactory rebuild --dry-run

# 5. Actual rebuild
deno task codefactory rebuild
```

### Backwards Compatibility
- Old `/codefactory.produce` behavior available via flag: `--immediate`
- Gradual migration supported
- Can mix manifest-based and direct generation

## Open Questions

1. **Conflict Resolution**: What if user manually edits generated file, then rebuilds?
   - Option A: Always overwrite (manifest is source of truth)
   - Option B: Detect conflicts, ask user
   - Option C: Use markers like `@codefactory-managed` sections

2. **Partial Regeneration**: Should we support regenerating only specific files?
   - Likely yes, via `deno task codefactory build <id>`

3. **Factory Versioning**: How to handle breaking changes in factory definitions?
   - Store factory version in manifest
   - Show warnings on rebuild if version mismatch

4. **Cross-Factory References**: How can one factory reference output of another?
   - Include `dependsOn` in manifest
   - Builder resolves execution order
   - Pass outputs as parameters to dependent factories

5. **Manifest Format**: Should we support YAML/TOML in addition to JSON?
   - Start with JSON (native to Deno/TypeScript)
   - Can add others later if needed

## Success Metrics

- ✅ Can regenerate entire project from manifest in <1 second
- ✅ Zero AI calls during build phase
- ✅ 100% deterministic output (same manifest → same code)
- ✅ Users prefer manifest workflow over direct generation
- ✅ Factory updates benefit all projects automatically

## Related Issues

- Ties into factory versioning strategy
- Enables proper testing of factories
- Foundation for factory marketplace/registry
- Enables CI/CD integration (build in pipeline)

## References

- Infrastructure as Code (IaC) patterns
- Declarative configuration systems
- Build system design (Make, Gradle, Bazel)
- Code generation best practices
