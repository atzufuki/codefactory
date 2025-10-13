/**
 * Example factories to get you started
 * 
 * These demonstrate different patterns for code generation.
 * Feel free to modify or remove these examples.
 */

import { defineFactory } from "@codefactory/core";

/**
 * Simple TypeScript function factory
 */
export const typescriptFunction = defineFactory({
  name: "typescript_function",
  description: "Creates a TypeScript function with type annotations",
  template: `/**
 * {{description}}
 */
export function {{functionName}}({{params}}): {{returnType}} {
  {{body}}
}`,
  outputPath: "src/functions/{{functionName}}.ts",
  params: {
    functionName: {
      description: "Name of the function",
      required: true,
    },
    description: {
      description: "Function description for JSDoc",
      required: false,
      default: "TODO: Add description",
    },
    params: {
      description: "Function parameters (e.g., 'x: number, y: number')",
      required: true,
    },
    returnType: {
      description: "Return type annotation",
      required: true,
    },
    body: {
      description: "Function body",
      required: true,
    },
  },
  examples: [
    {
      functionName: "add",
      description: "Adds two numbers",
      params: "a: number, b: number",
      returnType: "number",
      body: "return a + b;",
    },
  ],
});

/**
 * API endpoint factory
 */
export const apiEndpoint = defineFactory({
  name: "api_endpoint",
  description: "Creates a Deno HTTP API endpoint handler",
  template: `/**
 * {{description}}
 */
export async function {{handlerName}}(req: Request): Promise<Response> {
  // TODO: Implement {{handlerName}} logic
  
  return new Response(JSON.stringify({
    message: "{{successMessage}}"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}`,
  outputPath: "src/api/{{handlerName}}.ts",
  params: {
    handlerName: {
      description: "Name of the handler function",
      required: true,
    },
    description: {
      description: "What this endpoint does",
      required: true,
    },
    successMessage: {
      description: "Default success response message",
      required: false,
      default: "Success",
    },
  },
  examples: [
    {
      handlerName: "getUsers",
      description: "Retrieves all users from the database",
      successMessage: "Users retrieved successfully",
    },
  ],
});

/**
 * TypeScript interface factory
 */
export const typescriptInterface = defineFactory({
  name: "typescript_interface",
  description: "Creates a TypeScript interface definition",
  template: `/**
 * {{description}}
 */
export interface {{interfaceName}} {
  {{properties}}
}`,
  outputPath: "src/types/{{interfaceName}}.ts",
  params: {
    interfaceName: {
      description: "Name of the interface",
      required: true,
    },
    description: {
      description: "Interface description",
      required: false,
      default: "TODO: Add description",
    },
    properties: {
      description: "Interface properties (one per line, e.g., 'id: string;\\n  name: string;')",
      required: true,
    },
  },
  examples: [
    {
      interfaceName: "User",
      description: "Represents a user in the system",
      properties: "id: string;\n  name: string;\n  email: string;",
    },
  ],
});
