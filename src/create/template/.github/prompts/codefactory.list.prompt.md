---
description: List all available CodeFactory code generation templates with their parameters and descriptions
---

# List CodeFactories Command

## Purpose

Discover all available code generation factories in the current workspace, including their names, descriptions, parameters, and output paths.

## User Input

```text
$ARGUMENTS
```

You **MAY** use the user input to filter or search factories if provided.

## Execution Steps

1. **Load the factory registry**:
   - Read `factories/index.ts` from the workspace root
   - If file doesn't exist, inform user: "No factories directory found. Run this in a CodeFactory project."

2. **Parse and extract factory definitions**:
   - Look for all exported factory definitions
   - Each factory should have been created with `defineFactory()` or the `Factory` class
   - Extract factory metadata:
     - `name`: Factory identifier (snake_case)
     - `description`: What the factory generates
     - `template`: The code template (don't display full template in list)
     - `outputPath`: Where generated code will be written
     - `params`: Parameter definitions with descriptions and requirements

3. **Format the catalog**:
   
   Display factories in this format:
   
   ```
   ## Available Factories
   
   Found X factories in this workspace:
   
   ### 1. factory_name_here
   
   **Description**: What this factory generates
   
   **Output**: `path/to/output/{{variables}}.ts`
   
   **Parameters**:
   - `paramName` (required): Parameter description
   - `optionalParam` (optional): Another parameter description
   
   **Example**:
   ```
   Use this factory with: /codefactory.use factory_name_here
   ```
   
   ---
   
   [Repeat for each factory...]
   ```

4. **Handle edge cases**:
   - If no factories found: "No factories defined yet. Use `/codefactory.create` to create your first factory."
   - If registry file exists but is empty: "Factory registry exists but no factories exported."
   - If user provided search term in $ARGUMENTS: Filter factories by name or description match

5. **Provide helpful context**:
   - After listing, remind user: "Use `/codefactory.produce <factory_name>` to produce code with any of these factories."
   - If they seem to be looking for something specific that doesn't exist: Suggest `/codefactory.produce define_factory` to define a new factory

## Example Output

```markdown
## Available Factories

Found 3 factories in this workspace:

### 1. typescript_function

**Description**: Creates a TypeScript function with documentation

**Output**: `src/functions/{{functionName}}.ts`

**Parameters**:
- `functionName` (required): Name of the function
- `params` (required): Function parameters
- `returnType` (optional): Return type annotation (default: void)

**Example**:
```typescript
Use: /codefactory.produce typescript_function
```

---

### 2. api_endpoint

**Description**: Creates a REST API endpoint with validation

**Output**: `src/api/{{endpointName}}.ts`

**Parameters**:
- `endpointName` (required): Endpoint name (e.g., 'users', 'posts')
- `method` (required): HTTP method (GET, POST, PUT, DELETE)
- `hasAuth` (optional): Whether endpoint requires authentication (default: true)

**Example**:
```typescript
Use: /codefactory.produce api_endpoint
```

---

### 3. typescript_interface

**Description**: Creates a TypeScript interface definition

**Output**: `src/types/{{interfaceName}}.ts`

**Parameters**:
- `interfaceName` (required): Name of the interface
- `properties` (required): Interface properties

**Example**:
```typescript
Use: /codefactory.produce typescript_interface
```

---

💡 **Tip**: Use `/codefactory.produce <factory_name>` to produce code with any factory listed above.
```

## Notes

- This command is **read-only** - it never modifies files
- It helps users discover what code generation patterns are available
- Output should be concise but informative
- If workspace has many factories (>10), consider grouping by category or purpose
