---
description: Show manifest contents and dependency graph
---

# Inspect Manifest

You are helping the user view their `codefactory.manifest.json` file and understand their project structure.

## Your Task

1. **Load the manifest** from `codefactory.manifest.json`
2. **Display factory calls** with key details
3. **Show dependency graph** to illustrate execution order
4. **Indicate build status** (what's been generated vs pending)
5. **Provide helpful statistics**

## Process

```typescript
import { ManifestManager } from "@codefactory/core";

// Load manifest
const manager = await ManifestManager.load("./codefactory.manifest.json");
const manifest = manager.getManifest();

// Get execution order
const executionOrder = manager.getExecutionOrder();

// Check which files exist
const fs = await import("node:fs");
const buildStatus = manifest.factories.map(f => ({
  ...f,
  exists: fs.existsSync(f.outputPath)
}));
```

## Response Format

```
📋 Manifest Overview

Version: 1.0.0
Last generated: 2025-10-14 10:30:00
Factory calls: 3

---

Factory Calls:

1. ✅ button-component (design_system_component)
   Output: src/components/Button.ts
   Created: 2025-10-14 09:15:00
   Dependencies: none
   Status: Generated

2. ✅ card-component (design_system_component)
   Output: src/components/Card.ts
   Created: 2025-10-14 09:20:00
   Dependencies: button-component
   Status: Generated

3. ⏳ header-component (design_system_component)
   Output: src/components/Header.ts
   Created: 2025-10-14 10:25:00
   Dependencies: button-component, card-component
   Status: Pending (not yet built)

---

Execution Order:

1. button-component (no dependencies)
2. card-component (depends on: button-component)
3. header-component (depends on: button-component, card-component)

---

Dependency Graph:

button-component
  ↳ card-component
      ↳ header-component
  ↳ header-component

---

Statistics:

Total factory calls: 3
Generated files: 2 (67%)
Pending: 1 (33%)
Total dependencies: 3

Next steps:
🔨 Run /codefactory.produce to generate pending files
```

## Visual Dependency Graph

Create a text-based visualization of dependencies:

```
Execution Order (topological sort):

  [1] button-component
       ↓
  [2] card-component
       ↓
  [3] header-component

Dependencies:
  button-component → (no dependencies)
  card-component → button-component
  header-component → button-component, card-component
```

## Build Status Indicators

- ✅ **Generated** - File exists at outputPath
- ⏳ **Pending** - File doesn't exist yet
- ⚠️ **Modified** - File exists but was modified manually (if detectable)
- ❌ **Error** - File path invalid or other issue

## Detailed View

If user asks for details about a specific factory call:

```
📄 Detailed View: button-component

ID: button-component
Factory: design_system_component
Created: 2025-10-14 09:15:00
Factory version: 1.2.0

Parameters:
  componentName: "Button"
  props: ["label: string", "onClick: () => void"]
  stateVars: []

Output:
  Path: src/components/Button.ts
  Status: ✅ Generated
  Size: 2.4 KB
  Last modified: 2025-10-14 09:16:00

Dependencies:
  Depends on: (none)
  Required by: card-component, header-component

Generated code:
  Lines: 45
  Marker start: line 1
  Marker end: line 44
  User code: line 45-50 (6 lines)
```

## Empty Manifest

If manifest is empty or doesn't exist:

```
📋 Manifest is empty

No factory calls defined yet.

Get started:
  /codefactory.add "Create your first component"

Or check available factories:
  See factories/ directory for available templates
```

## Warnings and Recommendations

Show warnings if detected:

```
⚠️  Warnings:

- circular-dependency-id: Circular dependency detected
  Path: A → B → C → A
  Fix: Remove one of the dependencies

- orphan-file: File exists but not in manifest
  File: src/components/Orphan.ts
  Consider: Add to manifest or delete

- missing-file: Factory call exists but file is missing
  ID: button-component
  Expected: src/components/Button.ts
  Fix: Run /codefactory.produce to generate
```

## Statistics

Show helpful stats:

```
📊 Project Statistics

Factories:
  Total: 5
  Generated: 4 (80%)
  Pending: 1 (20%)

Dependencies:
  Total edges: 8
  Max depth: 3
  Circular: 0

Files:
  Total size: 12.5 KB
  Largest: Card.ts (4.2 KB)
  With user code: 2 (40%)

Last build: 5 minutes ago
Next build time (estimated): <1 second
```

## Interactive Options

After showing manifest, offer actions:

```
What would you like to do?
  1. Build all pending factory calls (/codefactory.produce)
  2. Add a new factory call (/codefactory.add)
  3. Update a factory call (/codefactory.update <id>)
  4. Remove a factory call (/codefactory.remove <id>)
  5. Show details for specific factory call

Or just ask me in natural language!
```
