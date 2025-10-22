/**
 * Parameter validation for preventing code abstractions
 * 
 * Validates factory parameters to ensure they are data points, not code abstractions.
 */

import type { AllowedParamType, ParamDefinition } from "./types.ts";

/**
 * Error thrown when parameter validation fails
 */
export class ParameterValidationError extends Error {
  constructor(paramName: string, message: string) {
    super(`Parameter '${paramName}': ${message}`);
    this.name = "ParameterValidationError";
  }
}

/**
 * Suspicious parameter names that likely indicate code abstractions
 */
const SUSPICIOUS_PARAM_NAMES = [
  "body",
  "content",
  "code",
  "implementation",
  "logic",
  "function",
  "method",
  "callback",
  "handler",
  "template",
  "jsx",
  "html",
  "render",
  "component",
];

/**
 * Check if a type string is an allowed parameter type
 * 
 * @param type - Type string to check
 * @returns True if type is allowed
 * 
 * @example
 * ```ts
 * isAllowedParamType("string") // true
 * isAllowedParamType("enum:left|center|right") // true
 * isAllowedParamType("Function") // false
 * ```
 */
export function isAllowedParamType(type: string): boolean {
  const allowedTypes: AllowedParamType[] = [
    "string",
    "number",
    "boolean",
    "string[]",
    "number[]",
    "boolean[]",
  ];
  
  // Check for exact match with primitive types
  if (allowedTypes.includes(type as AllowedParamType)) {
    return true;
  }
  
  // Check for enum pattern: "enum:value1|value2|..."
  if (type.startsWith("enum:")) {
    const enumValues = type.slice(5); // Remove "enum:" prefix
    // Validate that enum has at least one value
    return enumValues.length > 0 && enumValues.includes("|") || enumValues.length > 0;
  }
  
  return false;
}

/**
 * Check if a parameter name is suspicious (likely a code abstraction)
 * 
 * @param paramName - Parameter name to check
 * @returns True if name is suspicious
 * 
 * @example
 * ```ts
 * isSuspiciousParamName("body") // true
 * isSuspiciousParamName("componentName") // false
 * ```
 */
export function isSuspiciousParamName(paramName: string): boolean {
  const lowerName = paramName.toLowerCase();
  return SUSPICIOUS_PARAM_NAMES.some(suspicious => 
    lowerName === suspicious || lowerName.endsWith(suspicious)
  );
}

/**
 * Validate a single parameter definition
 * 
 * Throws ParameterValidationError if validation fails.
 * Logs warnings for suspicious configurations.
 * 
 * @param paramName - Name of the parameter
 * @param definition - Parameter definition to validate
 * @throws {ParameterValidationError} If validation fails
 * 
 * @example
 * ```ts
 * validateParamDefinition("name", {
 *   type: "string",
 *   description: "Component name",
 *   maxLength: 50
 * }); // OK
 * 
 * validateParamDefinition("body", {
 *   type: "string",
 *   description: "Function body"
 * }); // Logs warning
 * 
 * validateParamDefinition("code", {
 *   type: "Function",
 *   description: "Callback"
 * }); // Throws ParameterValidationError
 * ```
 */
export function validateParamDefinition(
  paramName: string,
  definition: ParamDefinition
): void {
  // Check that type is allowed
  if (!isAllowedParamType(definition.type)) {
    throw new ParameterValidationError(
      paramName,
      `Type '${definition.type}' not allowed. Use primitives only: string, number, boolean, string[], number[], boolean[], or enum:value1|value2|...`
    );
  }
  
  // Warn about suspicious names
  if (isSuspiciousParamName(paramName)) {
    console.warn(
      `⚠️  Parameter '${paramName}' might be a code abstraction! ` +
      `Consider using feature flags (boolean) or enums instead.`
    );
  }
  
  // Warn about string[] parameters that likely contain code syntax
  // e.g., "props" that would receive ["label: string", "onClick: () => void"]
  if (definition.type === "string[]") {
    // Check for problematic parameter names
    const problematicNames = [
      "props", "properties", "params", "parameters", 
      "arguments", "args", "fields", "members",
      "attributes", "signals", "methods", "functions"
    ];
    
    const isProbablematic = problematicNames.some(name => 
      paramName.toLowerCase() === name || 
      paramName.toLowerCase().endsWith(name)
    );
    
    if (isProbablematic && !paramName.endsWith("Names") && !paramName.endsWith("Types") && 
        !paramName.endsWith("Values") && !paramName.endsWith("Defaults")) {
      console.warn(
        `⚠️  Parameter '${paramName}' (string[]) likely contains code syntax! ` +
        `\n   Bad:  ${paramName}: string[]  →  ["label: string", "count: number"]` +
        `\n   Good: ${paramName}Names: string[]  →  ["label", "count"]` +
        `\n         ${paramName}Types: string[]  →  ["string", "number"]` +
        `\n   This separates data from code and prevents code injection.`
      );
    }
  }
  
  // Warn about too large maxLength values (>200 characters = probably code)
  if (definition.maxLength && definition.maxLength > 200) {
    console.warn(
      `⚠️  Parameter '${paramName}' maxLength=${definition.maxLength} is suspiciously large! ` +
      `This might indicate a code abstraction.`
    );
  }
  
  // Validate pattern is a valid regex if provided
  if (definition.pattern) {
    try {
      new RegExp(definition.pattern);
    } catch (_error) {
      throw new ParameterValidationError(
        paramName,
        `Invalid regex pattern: ${definition.pattern}`
      );
    }
  }
}

/**
 * Validate all parameters in a factory definition
 * 
 * Logs warnings for suspicious configurations but doesn't throw errors
 * unless a parameter type is completely invalid.
 * 
 * @param params - Record of parameter definitions
 * @throws {ParameterValidationError} If any parameter has invalid type
 * 
 * @example
 * ```ts
 * validateFactoryParamsWithWarnings({
 *   componentName: {
 *     type: "string",
 *     description: "Name of component",
 *     maxLength: 50
 *   },
 *   isPublic: {
 *     type: "boolean",
 *     description: "Whether component is exported"
 *   }
 * }); // OK
 * ```
 */
export function validateFactoryParamsWithWarnings(
  params: Record<string, ParamDefinition>
): void {
  for (const [paramName, definition] of Object.entries(params)) {
    validateParamDefinition(paramName, definition);
  }
}
