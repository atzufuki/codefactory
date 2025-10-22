/**
 * Tests for parameter validation
 */

import { assertEquals, assertStringIncludes, assertThrows } from "@std/assert";
import {
  isAllowedParamType,
  isSuspiciousParamName,
  ParameterValidationError,
  validateFactoryParamsWithWarnings,
  validateParamDefinition,
} from "../validator.ts";

Deno.test("isAllowedParamType - accepts primitive types", () => {
  assertEquals(isAllowedParamType("string"), true);
  assertEquals(isAllowedParamType("number"), true);
  assertEquals(isAllowedParamType("boolean"), true);
});

Deno.test("isAllowedParamType - accepts array types", () => {
  assertEquals(isAllowedParamType("string[]"), true);
  assertEquals(isAllowedParamType("number[]"), true);
  assertEquals(isAllowedParamType("boolean[]"), true);
});

Deno.test("isAllowedParamType - accepts enum types", () => {
  assertEquals(isAllowedParamType("enum:left|center|right"), true);
  assertEquals(isAllowedParamType("enum:small|medium|large"), true);
  assertEquals(isAllowedParamType("enum:single"), true);
});

Deno.test("isAllowedParamType - rejects complex types", () => {
  assertEquals(isAllowedParamType("Function"), false);
  assertEquals(isAllowedParamType("object"), false);
  assertEquals(isAllowedParamType("Record<string, unknown>"), false);
  assertEquals(isAllowedParamType("() => void"), false);
  assertEquals(isAllowedParamType("any"), false);
});

Deno.test("isSuspiciousParamName - detects suspicious names", () => {
  assertEquals(isSuspiciousParamName("body"), true);
  assertEquals(isSuspiciousParamName("content"), true);
  assertEquals(isSuspiciousParamName("code"), true);
  assertEquals(isSuspiciousParamName("implementation"), true);
  assertEquals(isSuspiciousParamName("logic"), true);
  assertEquals(isSuspiciousParamName("function"), true);
  assertEquals(isSuspiciousParamName("method"), true);
  assertEquals(isSuspiciousParamName("callback"), true);
  assertEquals(isSuspiciousParamName("handler"), true);
  assertEquals(isSuspiciousParamName("template"), true);
  assertEquals(isSuspiciousParamName("jsx"), true);
  assertEquals(isSuspiciousParamName("html"), true);
  assertEquals(isSuspiciousParamName("render"), true);
  assertEquals(isSuspiciousParamName("component"), true);
});

Deno.test("isSuspiciousParamName - detects names ending with suspicious words", () => {
  assertEquals(isSuspiciousParamName("functionBody"), true);
  assertEquals(isSuspiciousParamName("pageContent"), true);
  assertEquals(isSuspiciousParamName("jsxTemplate"), true);
});

Deno.test("isSuspiciousParamName - allows normal names", () => {
  assertEquals(isSuspiciousParamName("componentName"), false);
  assertEquals(isSuspiciousParamName("isPublic"), false);
  assertEquals(isSuspiciousParamName("maxItems"), false);
  assertEquals(isSuspiciousParamName("alignment"), false);
  assertEquals(isSuspiciousParamName("tags"), false);
});

Deno.test("validateParamDefinition - accepts valid primitive parameter", () => {
  // Should not throw
  validateParamDefinition("componentName", {
    type: "string",
    description: "Name of the component",
    required: true,
    maxLength: 50,
  });
});

Deno.test("validateParamDefinition - accepts valid boolean parameter", () => {
  validateParamDefinition("isPublic", {
    type: "boolean",
    description: "Whether component is public",
    default: false,
  });
});

Deno.test("validateParamDefinition - accepts valid enum parameter", () => {
  validateParamDefinition("alignment", {
    type: "enum:left|center|right",
    description: "Text alignment",
  });
});

Deno.test("validateParamDefinition - accepts valid array parameter", () => {
  validateParamDefinition("tags", {
    type: "string[]",
    description: "List of tags",
  });
});

Deno.test("validateParamDefinition - accepts valid pattern", () => {
  validateParamDefinition("identifier", {
    type: "string",
    description: "Valid identifier",
    pattern: "^[a-zA-Z][a-zA-Z0-9]*$",
  });
});

Deno.test("validateParamDefinition - throws on invalid type", () => {
  assertThrows(
    () => {
      validateParamDefinition("callback", {
        type: "Function",
        description: "Callback function",
      });
    },
    ParameterValidationError,
    "Type 'Function' not allowed"
  );
});

Deno.test("validateParamDefinition - throws on object type", () => {
  assertThrows(
    () => {
      validateParamDefinition("config", {
        type: "object",
        description: "Configuration object",
      });
    },
    ParameterValidationError,
    "Type 'object' not allowed"
  );
});

Deno.test("validateParamDefinition - throws on invalid regex pattern", () => {
  assertThrows(
    () => {
      validateParamDefinition("name", {
        type: "string",
        description: "Name",
        pattern: "[invalid(regex",
      });
    },
    ParameterValidationError,
    "Invalid regex pattern"
  );
});

Deno.test("validateFactoryParamsWithWarnings - validates all parameters", () => {
  // Should not throw
  validateFactoryParamsWithWarnings({
    componentName: {
      type: "string",
      description: "Name of component",
      maxLength: 50,
    },
    isPublic: {
      type: "boolean",
      description: "Whether component is exported",
    },
    alignment: {
      type: "enum:left|center|right",
      description: "Text alignment",
    },
  });
});

Deno.test("validateFactoryParamsWithWarnings - throws on any invalid parameter", () => {
  assertThrows(
    () => {
      validateFactoryParamsWithWarnings({
        name: {
          type: "string",
          description: "Valid parameter",
        },
        callback: {
          type: "Function",
          description: "Invalid parameter",
        },
      });
    },
    ParameterValidationError,
    "Type 'Function' not allowed"
  );
});

Deno.test("validateFactoryParamsWithWarnings - handles empty params", () => {
  // Should not throw
  validateFactoryParamsWithWarnings({});
});

Deno.test("validateParamDefinition - warns about string[] params that likely contain code", () => {
  // These should log warnings (captured by console)
  const consoleWarnSpy = console.warn;
  const warnings: string[] = [];
  console.warn = (...args: unknown[]) => {
    warnings.push(args.join(" "));
  };

  try {
    validateParamDefinition("props", {
      type: "string[]",
      description: "Component props",
    });
    
    // Should have warning about props parameter
    assertEquals(warnings.length > 0, true);
    assertStringIncludes(warnings[0], "props");
    assertStringIncludes(warnings[0], "code syntax");
  } finally {
    console.warn = consoleWarnSpy;
  }
});
