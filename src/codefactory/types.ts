/**
 * Core types for the AI Code Factory system
 */

/**
 * Allowed parameter types - all primitives or lists of them
 * Forces parameters to be data points, not code abstractions
 */
export type AllowedParamType =
  | "string"      // Short texts: names, IDs, classes
  | "number"      // Numeric values: sizes, counts
  | "boolean"     // Feature flags: on/off
  | "string[]"    // Lists of strings
  | "number[]"    // Lists of numbers
  | "boolean[]"   // Lists of booleans
  | `enum:${string}`; // Limited set of options, e.g.: "enum:left|center|right"

/**
 * Parameters that can be passed to a factory
 */
export type FactoryParams = Record<string, unknown>;

/**
 * Result returned by a factory execution
 */
export interface FactoryResult {
  /** The generated code content */
  content: string;
  /** Optional target file path */
  filePath?: string;
  /** Optional imports to add */
  imports?: string[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Definition of a code generation factory
 */
export interface FactoryDefinition {
  /** Unique name of the factory */
  name: string;
  /** Human-readable description */
  description: string;
  /** Parameter definitions */
  params: Record<string, ParamDefinition>;
  /** Example usages */
  examples?: Array<Record<string, unknown>>;
  /** The generator function */
  generate: (params: FactoryParams) => FactoryResult | Promise<FactoryResult>;
  /** Optional template string (for extraction-based sync) */
  template?: string;
}

/**
 * Definition of a factory parameter
 */
export interface ParamDefinition {
  /** TypeScript type as string - must be one of AllowedParamType */
  type: string;
  /** Parameter description */
  description: string;
  /** Whether parameter is required */
  required?: boolean;
  /** Default value if not provided */
  default?: unknown;
  /** Maximum length for string parameters (prevents code abstractions) */
  maxLength?: number;
  /** Regex pattern for validation (e.g., for identifiers: "^[a-zA-Z][a-zA-Z0-9]*$") */
  pattern?: string;
}
