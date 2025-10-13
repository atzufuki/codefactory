---
description: Produce code by executing a CodeFactory template with specified parameters
---

# Produce with CodeFactory Command

## Purpose

Produce code by executing a specific factory. The factory will generate code based on its template and the parameters you provide.

## User Input

```text
$ARGUMENTS
```

You **MUST** extract the factory name and parameters from the user input.

## Execution Steps

1. **Parse user input**:
   - Extract factory name (first argument or clear from context)
   - Extract parameter values from user input
   - If user didn't provide clear parameters, you may need to ask for them

2. **Load the factory**:
   - Read `factories/index.ts` from workspace root
   - Find and load the requested factory by name
   - If factory not found: List available factories and ask user to choose one

3. **Validate parameters**:
   - Check factory's parameter definitions
   - Ensure all required parameters are provided
   - If missing required parameters, prompt user with specific questions:
     ```
     The `{{factory_name}}` factory requires these parameters:
     - `paramName` (required): description
     - `anotherParam` (required): description
     
     Please provide values for these parameters.
     ```

4. **Execute the factory**:
   - Apply template substitutions with provided parameters
   - Replace all `{{variable}}` placeholders with actual values
   - Determine output path (may include variable substitutions)

5. **Generate code**:
   - Create necessary directories if they don't exist
   - Write generated code to the output path
   - Show user the generated file path and a preview of the code

6. **Confirm and explain**:
   ```
   ✅ Generated code using factory: {{factory_name}}
   
   📄 File: {{output_path}}
   
   Preview:
   ```{{language}}
   [Show first 10-15 lines of generated code]
   ```
   
   The factory produced {{line_count}} lines of code.
   ```

## Parameter Extraction Examples

### Example 1: Natural Language (Most Common)
User: "Create a TypeScript function called calculateTotal that takes an array of items and returns a number"

Extract:
- factory: `typescript_function` (inferred from "TypeScript function")
- functionName: `calculateTotal`
- params: `items: Item[]`
- returnType: `number`

**Response**: Produce code immediately with inferred parameters.

### Example 2: Explicit Command
User: "/codefactory.produce typescript_function with name calculateTotal, params items: Item[], returns number"

Extract:
- factory: `typescript_function` (explicit)
- functionName: `calculateTotal`
- params: `items: Item[]`
- returnType: `number`

**Response**: Produce code with specified parameters.

### Example 3: Conversational with Missing Info
User: "Create an API endpoint for users"

Extract:
- factory: `api_endpoint` (inferred from "API endpoint")
- endpointName: `users`
- method: ❓ (missing - needs clarification)

**Response**:
```
I'll produce an API endpoint for users. What HTTP method should it use?
- GET (retrieve users)
- POST (create user)
- PUT (update user)
- DELETE (remove user)
```

### Example 4: Ambiguous Request
User: "Make a component for displaying user profiles"

**Response**:
```
I don't see a component factory in this project. Would you like to:
1. Create a new factory for components? (/codefactory.produce define_factory)
2. Write the component code directly?
3. List available factories to see what's available? (/codefactory.list)
```

### Example 5: Factory Name + Natural Params
User: "/codefactory.produce api_endpoint for users, GET method, requires authentication"

Extract:
- factory: `api_endpoint`
- endpointName: `users`
- method: `GET`
- hasAuth: `true`

**Response**: Produce code with all parameters provided.

## Error Handling

### Factory Not Found
```
❌ Factory "{{name}}" not found.

Available factories:
[List top 3-5 factories]

Use `/codefactory.list` to see all available factories.
```

### Missing Required Parameters
```
⚠️ Missing required parameters for factory "{{name}}":

Required:
- `paramName`: description
- `anotherParam`: description

Please provide these values.
```

### File Already Exists
```
⚠️ File already exists: {{path}}

Options:
1. Overwrite the existing file
2. Choose a different output location
3. Cancel operation

What would you like to do?
```

## Example Workflow

**User Request**: "Produce a validateEmail function using the typescript_function factory"

**Assistant Response**:
```
I'll produce code using the `typescript_function` factory.

Let me get the required parameters:
- Function name: validateEmail
- Parameters: email: string
- Return type: boolean (assuming validation returns true/false)

Producing code...

✅ Code produced using factory: typescript_function

📄 File: src/functions/validateEmail.ts

Preview:
```typescript
/**
 * validateEmail function
 */
export function validateEmail(email: string): boolean {
  // TODO: Implement function logic
}
```

The factory produced 7 lines of code. You can now implement the validation logic in the function body.
```

## Notes

- **Always validate** before producing - don't create invalid code
- **Show previews** - let user see what will be produced
- **Ask for confirmation** if overwriting existing files
- **Be helpful** - if parameters are unclear, ask specific questions
- **Learn from context** - infer reasonable defaults when appropriate
- **Respect factory definitions** - don't modify the template, execute it as defined

## Best Practices

1. **Prefer factories over manual code**: If a factory exists, produce with it
2. **Clear communication**: Always tell user which factory you're producing with
3. **Parameter validation**: Check required params before production
4. **Path awareness**: Create directories as needed
5. **Code preview**: Show user what was produced
6. **Error recovery**: Provide clear next steps on errors

---

💡 **Remember**: Factories are deterministic. Same inputs = same output. This is by design!
