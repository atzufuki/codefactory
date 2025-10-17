# /codefactory.sync - Sync Generated Files

## Purpose
Re-extract parameters from generated source code and regenerate factory sections. This is the core of the **extraction-based workflow** where code is the single source of truth.

## Usage

```
/codefactory.sync                    # Sync all files in current directory
/codefactory.sync src/components     # Sync all files in specific directory
/codefactory.sync Button.ts          # Sync specific file
```

## How It Works

### 2. Example Sync Flow
This command should call the `codefactory_sync` MCP tool:

```json
{
  "name": "codefactory_sync",
  "arguments": {
    "path": "./src"
  }
}
```

Or for a specific file:

```json
{
  "name": "codefactory_sync",
  "arguments": {
    "path": "src/components/Button.ts"
  }
}
```

The MCP tool will:
1. Load the factory registry
2. Scan for files with `@codefactory` markers
3. For each file:
   - Extract factory name from marker
   - Get template from factory
   - Extract parameters from source code
   - Regenerate marked section
   - Preserve custom code outside markers
4. Return sync results

**Before sync (user edited code):**
```typescript
// @codefactory:start factory="web_component"
class Button extends HTMLProps(HTMLElement)<ButtonProps>() {
  // User added new signals
  count = signal<number>(0);
  isDisabled = signal<boolean>(false);  // ← NEW!
  
  render() {
    return new html.Button({ content: this.label });
  }
}
Button.define('app-button');
// @codefactory:end

// Custom code preserved
export const PrimaryButton = styled(Button);
```

**After sync:**
- System detects 2 signals: `count` and `isDisabled`
- Regenerates factory section with both signals
- Custom code below marker is untouched

## What Gets Synced

### ✅ Synced (inside markers):
- Signal declarations that match template pattern
- Props in interface that match template pattern
- Class name, tag name, etc.
- Anything that matches template structure

### ✅ Preserved (outside markers):
- Custom exports
- Helper functions
- Styled components
- Additional imports
- Comments

### ❌ Warning (custom code inside markers):
- Methods not in template
- Code that doesn't match template patterns
- Will be **removed** on sync (should be moved outside markers)

## Smart Parameter Extraction

The sync command uses template analysis to extract parameters:

```typescript
// Template pattern:
{{this.name}} = signal<{{this.type}}>({{this.default}});

// Source code:
count = signal<number>(0);
isOpen = signal<boolean>(false);
userId = signal<string>("");

// Extracted params:
signals: [
  { name: "count", type: "number", default: "0" },
  { name: "isOpen", type: "boolean", default: "false" },
  { name: "userId", type: "string", default: '""' }
]
```

## Response Format

### Successful Sync
```
✅ Synced 3 files in 45ms

📝 Changes detected:
  - src/components/Button.ts
    ↳ Added signal: isDisabled (boolean)
    ↳ Changed tagName: app-button → my-button
  
  - src/components/Card.ts
    ↳ Added prop: elevation (number)
  
  - src/components/Modal.ts
    ↳ No changes detected

Custom code preserved (25 lines outside markers)
```

### Sync with Warnings
```
⚠️  Synced with warnings:

✅ src/components/Button.ts - Synced
⚠️  src/components/Card.ts - Custom code inside markers detected

Custom code detected inside @codefactory markers:
  Lines 15-20:
    handleClick() {
      this.count.set(this.count() + 1);
    }

This code will be REMOVED on sync!

Options:
  [1] Move code outside markers
  [2] Skip this file
  [3] Continue anyway (code will be lost)
  
Choice: _
```

### Errors
```
❌ Sync failed for 1 file:

  src/components/Button.ts:
    Factory "unknown_factory" not found in registry
    
Available factories:
  - web_component
  - react_component
  - factory

Fix: Update marker to use existing factory name
```

## Use Cases

### Use Case 1: After Editing Code
```
1. Edit src/components/Button.ts (add signals, change props)
2. Run /codefactory.sync
3. Factory sections regenerated with new params
4. Custom code preserved
```

### Use Case 2: After Template Update
```
1. Factory template is updated (e.g., new render pattern)
2. Run /codefactory.sync
3. All files regenerated with new template
4. Parameters extracted from current code
5. New template applied consistently
```

### Use Case 3: Team Sync
```
1. Pull changes from git
2. Teammate updated factory template
3. Run /codefactory.sync
4. All generated files updated to match new template
```

## Sync Specific File

Call MCP tool with specific file path:

```json
{
  "name": "codefactory_sync",
  "arguments": {
    "path": "src/components/Button.ts"
  }
}
```

## Dry Run (Preview Changes)

Not yet available via MCP tool. Future feature:

```json
{
  "name": "codefactory_sync",
  "arguments": {
    "path": "./src",
    "dryRun": true
  }
}
```

This would preview changes without writing files.

## Error Scenarios

### No Marker Found
```
❌ src/components/Button.ts has no @codefactory marker

This file is not managed by codefactory.

To make it managed:
  1. Add marker: // @codefactory:start factory="web_component"
  2. Add end marker: // @codefactory:end
  3. Run /codefactory.sync
```

### Old Marker Format
```
❌ Old marker format detected in Button.ts

Found: // @codefactory:start id="abc-123"
Expected: // @codefactory:start factory="web_component"

The extraction system requires the new marker format.

Options:
  1. Update marker manually
  2. Delete file and use /codefactory.create
```

### Extraction Failed
```
❌ Failed to extract parameters from Button.ts

The code structure has diverged from template:
  Template expects: class {{name}} extends HTMLProps(HTMLElement)
  Found: class Button extends HTMLElement

Options:
  [1] Fix code to match template
  [2] Remove @codefactory markers (make fully custom)
  [3] Update template to match code (affects ALL files)
  [4] Skip this file
  
Choice: _
```

## Best Practices

### ✅ DO:
1. Run sync after editing code
2. Add custom code OUTSIDE markers
3. Keep code structure matching template
4. Commit before sync (for safety)

### ❌ DON'T:
1. Add custom methods inside markers (they'll be lost)
2. Break template structure (e.g., change base class)
3. Remove markers manually
4. Ignore warnings

## Integration with Git

```bash
# Safe workflow:
git add .
git commit -m "Edit components"
deno run codefactory sync
git diff  # Review changes
git add .
git commit -m "Sync factory sections"
```

## Performance

Sync is fast because:
- No AI inference needed (uses regex extraction)
- Only files with markers are processed
- Parallel processing (future optimization)

```
📊 Sync performance:
  3 files × 15ms each = 45ms total
  
  vs. AI-based regeneration:
  3 files × 5000ms each = 15s total
  
  333× faster! 🚀
```

## Implementation Notes

1. **Always call the MCP tool** - Use `codefactory_sync` MCP tool, don't write TypeScript code
2. **Handle errors gracefully** - MCP tool returns actionable error messages
3. **Show sync results** - Display what was changed from tool response
4. **Preserve custom code** - Tool automatically preserves code outside markers
5. **Warn about loss** - Tool alerts if code would be removed

## Next Steps After Sync

1. **Review changes** - Check git diff
2. **Test code** - Ensure everything still works
3. **Commit** - Save your work
4. **Iterate** - Edit → Sync → Edit → Sync

This is the power of extraction-based workflow! 🎉
