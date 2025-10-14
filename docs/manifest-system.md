# Build Manifest System

> Two-phase code generation: Plan with AI, Build deterministically

## Status
✅ **Complete** - Core infrastructure and Copilot integration ready (49 tests passing)

## Overview

The manifest system enables deterministic, reproducible code generation by separating the planning phase (with AI) from the build phase (without AI).

Instead of generating code immediately, factory calls are stored in a `codefactory.manifest.json` file - a "recipe" for your project. This manifest can be executed anytime to regenerate code with identical results.

## Two-Phase Approach

### Phase 1: Planning (with AI)
AI parses user intent and adds factory calls to manifest:
```typescript
manager.addFactoryCall({
  id: "button-component",
  factory: "design_system_component",
  params: { componentName: "Button", props: ["label: string"] },
  outputPath: "src/components/Button.ts",
});
```

### Phase 2: Building (deterministic, no AI)
Producer executes manifest to generate code:
```typescript
const producer = new Producer(manifest, registry);
const result = await producer.buildAll();
// Files created with markers for safe regeneration
```

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
User: /codefactory.add "Create a user list component with UserList name"
AI: 
  → Parses intent
  → Determines factory: react_component
  → Extracts params: {componentName: "UserList", ...}
  → Calls ManifestManager.addFactoryCall()
  → Response: "Added 'user-list-component' to manifest. Run /codefactory.produce to generate."
```

### 2. Produce Code (no AI, deterministic)
```
User: /codefactory.produce
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
  → Response: "Updated manifest. Run /codefactory.produce to regenerate."
```

### 4. Remove Factory Call
```
User: /codefactory.remove user-list-component
AI:
  → Removes from manifest
  → Optionally deletes generated file
  → Response: "Removed 'user-list-component' from manifest."
```

## GitHub Copilot Integration

### Commands

#### `/codefactory.add` (new)
- AI parses user intent
- Determines factory name and parameters
- Adds factory call to manifest
- **Does NOT generate code immediately**
- Shows what was added
- Example: `/codefactory.add "Create a React button component"`

#### `/codefactory.produce` (new)
- Reads manifest
- Executes all factory calls in dependency order
- Generates code to files
- No AI inference needed
- Fast and deterministic
- Example: `/codefactory.produce`

#### `/codefactory.update` (new)
- Modify existing factory call parameters
- AI helps parse new parameters
- Updates manifest
- User must run `/codefactory.produce` to regenerate
- Example: `/codefactory.update user-list-component props=["users: User[]"]`

#### `/codefactory.remove` (new)
- Remove factory call from manifest by ID
- Optionally delete generated files
- Example: `/codefactory.remove user-list-component`

#### `/codefactory.inspect` (new)
- Show manifest contents
- Highlight what has been generated vs pending
- Show dependency graph
- Example: `/codefactory.inspect`

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
| **CodeFactory** | `codefactory.manifest.json` | `/codefactory.produce` |

## Implementation Status

### ✅ Core Infrastructure (Complete)
- **ManifestManager** (`src/codefactory/manifest.ts`) - 221 lines, 17 tests
  - Add/remove/update factory calls
  - Dependency resolution with topological sort
  - Circular dependency detection
  - Save/load to disk
  
- **Producer** (`src/codefactory/producer.ts`) - 338 lines, 9 tests
  - Build all or specific factory calls
  - Marker-based file generation
  - Dry-run preview mode
  - Comprehensive error handling

### ✅ Copilot Integration (Complete)
- AI workflow documentation in `.github/copilot-instructions.md`
- Comprehensive examples in `template/examples/`
- Natural language command patterns
- Usage guide and best practices

### 🔮 Future Enhancements
See [ROADMAP.md](../ROADMAP.md) Phase 7 for planned features:
- Incremental builds
- Parallel execution
- Manifest diff tool
- Factory call templates

## File Management Strategy

### Marker-Based Generation (Always)

All generated code is **always** wrapped in markers:

```typescript
// @codefactory:start id="factory-call-id"
// Generated code here
export function greet(name: string) {
  return `Hello, ${name}!`;
}
// @codefactory:end

// User's custom code - safe to edit
console.log(greet("World"));
```

### Behavior

**First generation** (file doesn't exist):
- Create file with markers around generated code
- User can add custom code outside markers

**Regeneration** (file exists with markers):
- Replace only content between markers
- Preserve all user code outside markers
- Safe and deterministic

**Error case** (file exists without markers):
- **Refuse to generate** - show error message
- User must either:
  1. Delete the file and regenerate
  2. Add markers manually to the file
  3. Change `outputPath` in manifest

### Best Practices

**Recommended**: Keep generated and manual code separate
```
src/
  components/
    UserList.generated.tsx    # From codefactory
    UserList.tsx              # User's wrapper/customization
```

**Allowed**: Mix in same file (use with caution)
```typescript
// @codefactory:start id="user-list-base"
export function UserListBase(props: Props) { /* generated */ }
// @codefactory:end

// Custom enhancement
export function UserList(props: Props) {
  return <UserListBase {...props} />;
}
```

## Design Decisions

### ✅ Partial Regeneration
Supported via `producer.build(["id1", "id2"])` for targeted rebuilds.

### ✅ Dependency Management
Factory calls can specify `dependsOn: ["other-id"]` for execution order.

### ✅ Manifest Format
JSON format (native to Deno/TypeScript). Future: YAML/TOML support possible.

### ✅ Marker Format
Current: `// @codefactory:start id="..."` for all languages.
Future: Language-specific comment styles configurable.

## Success Metrics

- ✅ Can regenerate entire project from manifest in <1 second
- ✅ Zero AI calls during build phase
- ✅ 100% deterministic output (same manifest → same code)
- ✅ 49 tests passing with comprehensive coverage
- ✅ Factory updates benefit all projects automatically

## Usage Examples

See complete examples in:
- `src/create/template/examples/MANIFEST_EXAMPLES.md` - Comprehensive guide
- `src/create/template/examples/example-workflow.ts` - Working demonstration

Quick start:
```typescript
import { ManifestManager, Producer, FactoryRegistry } from "@codefactory/codefactory";

// Load manifest
const manager = await ManifestManager.load("./codefactory.manifest.json");

// Add factory call
manager.addFactoryCall({
  id: "my-component",
  factory: "component_factory",
  params: { name: "MyComponent" },
  outputPath: "src/MyComponent.ts",
});
await manager.save();

// Build
const registry = new FactoryRegistry();
await registry.autoRegister("./factories");
const producer = new Producer(manager.getManifest(), registry);
await producer.buildAll();
```

## Related Concepts

- **Infrastructure as Code** (IaC) - Declarative infrastructure management
- **Build Systems** (Make, Gradle, Bazel) - Dependency-based task execution
- **Package Managers** (npm, cargo) - Manifest-driven dependency resolution
- **Configuration Management** (Terraform, Kubernetes) - Desired state → Actual state
