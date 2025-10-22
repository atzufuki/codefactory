# E2E Test Suite: Meta-Factory Integration

## Overview

The E2E test suite validates the complete codefactory workflow from project bootstrap through factory creation, file generation, editing, syncing, and cleanup.

## Test Phases

### Phase 1: Bootstrap Project (`01-bootstrap.test.ts`)
- Creates a new codefactory project from template
- Verifies all expected files and directories exist
- Checks MCP configuration is set up correctly
- Validates GitHub Copilot integration files

### Phase 2: Create Factory with Meta-Factory (`02-create-factory.test.ts`) ⭐ **KEY TEST**
**What it does:**
1. Uses the built-in `factory` meta-factory to create a new `greeter` factory
2. Verifies the factory file has correct YAML frontmatter format
3. Ensures NO JSDoc metadata interference (validates the bug fix)
4. Tests that the new factory auto-registers correctly

**Why it matters:**
- This is the **critical test** that catches the bug where factories created with the meta-factory weren't registering
- Validates the complete meta-factory workflow: create → register → use
- Ensures factories can be created programmatically (key for AI agents)

**What was broken before:**
```typescript
/** @codefactory factory     ← JSDoc metadata interfered
 * name: greeter
 */
---                          ← YAML parser failed
name: greeter
---
```

**What works now:**
```typescript
---                          ← Clean YAML frontmatter
name: greeter
description: Creates a greeting function
---
export function {{functionName}}...
```

### Phase 3: Create File with Factory (`03-create-file.test.ts`)
- Uses the `greeter` factory created in Phase 2
- Creates a file via MCP create tool
- Verifies file has JSDoc metadata markers
- Validates generated code is correct

**Integration point:** This phase uses the factory created by the meta-factory in Phase 2, proving the end-to-end workflow works.

### Phase 4: Edit and Sync (`04-edit-and-sync.test.ts`)
- Edits the metadata in the generated file
- Syncs to regenerate code with new parameters
- Validates the extraction-based workflow

### Phase 5: Cleanup (`05-cleanup.test.ts`)
- Removes test project directory
- Cleans up temporary files

## Running the Tests

```bash
# Run all E2E tests in order
deno test --allow-read --allow-write --allow-env --allow-run tests/e2e/

# Run just the meta-factory test
deno test --allow-read --allow-write --allow-env tests/e2e/02-create-factory.test.ts

# Run all tests (includes unit tests)
deno task test
```

## Test Flow

```
Phase 1: Bootstrap
    ↓
    Creates project with factories/ directory
    ↓
Phase 2: Create Factory ⭐
    ↓
    Uses meta-factory to create 'greeter' factory
    Validates YAML format (no JSDoc)
    ↓
Phase 3: Create File
    ↓
    Uses 'greeter' factory from Phase 2
    Creates greet.ts with metadata
    ↓
Phase 4: Edit & Sync
    ↓
    Edits metadata, regenerates code
    ↓
Phase 5: Cleanup
    ↓
    Removes test project
```

## What the Meta-Factory Test Validates

### 1. **Factory Creation**
- Meta-factory generates valid `.hbs` template files
- YAML frontmatter is correctly formatted
- No JSDoc metadata interference

### 2. **Factory Registration**
- Auto-discovery finds the new factory file
- Template loader parses YAML correctly
- Registry contains the new factory

### 3. **Factory Usability**
- New factory appears in catalog
- Factory metadata is accessible
- Ready to be used by Producer/MCP tools

## Why This Test Is Critical

**Problem it solves:**
- AI agents (via MCP) need to create custom factories
- Factories must auto-register immediately
- Without this, the "factory-of-factories" pattern breaks

**Impact:**
- Validates core meta-factory capability
- Prevents regression of the JSDoc bug
- Ensures AI agents can extend the system

## Test Results

```
✅ Phase 1: Bootstrap project (60ms)
✅ Phase 2: Create factory using meta-factory (11ms) ⭐
✅ Phase 3: Create file using greeter factory (11ms)
✅ Phase 4: Edit metadata and sync (10ms)
✅ Phase 5: Cleanup (8ms)

Total: 5 passed | 0 failed (423ms)
```

## Future Considerations

1. Update Phase 2 to verify JSDoc metadata format works correctly
2. Modify template loader stripping logic for new format
3. Ensure backward compatibility or clean migration path

The current implementation is **forward-compatible** with the proposed changes.
