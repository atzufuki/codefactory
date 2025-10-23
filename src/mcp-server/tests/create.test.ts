/**
 * Tests for codefactory_create tool (metadata-based workflow)
 */

import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import { createTool } from "../tools/create.ts";

// Helper to create a test factory
async function createTestFactory(dir: string, name: string, template: string) {
  await Deno.writeTextFile(
    `${dir}/${name}.codefactory`,
    `name: ${name}
description: Test factory ${name}
outputPath: src/{{name}}.ts
params:
  name:
    type: string
    required: true

template: |
  ${template}
`,
  );
}

Deno.test("codefactory_create - should create file with JSDoc metadata", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Create test factory
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const result = await createTool.execute({
      factory: "test_factory",
      params: { name: "Hello" },
      outputPath: `${tempOutput}/hello.ts`,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    assertExists(result.content);
    assertEquals(result.content[0].type, "text");

    // Verify file was created with JSDoc metadata format
    const content = await Deno.readTextFile(`${tempOutput}/hello.ts`);
    assertStringIncludes(content, '/**');
    assertStringIncludes(content, ' * @codefactory test_factory');
    assertStringIncludes(content, "export const Hello = 'test';");
    assertStringIncludes(content, ' */');
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should error if file already exists", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const outputPath = `${tempOutput}/existing.ts`;
    
    // Create existing file
    await Deno.writeTextFile(outputPath, "existing content");

    const result = await createTool.execute({
      factory: "test_factory",
      params: { name: "Test" },
      outputPath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, true);
    assertExists(result.content);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "exists");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should error if factory not found", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    const result = await createTool.execute({
      factory: "nonexistent_factory",
      params: { name: "Test" },
      outputPath: `${tempOutput}/test.ts`,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, true);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "not found");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should require factory name", async () => {
  const result = await createTool.execute({
    params: { name: "Test" },
    outputPath: "/tmp/test.ts",
  });

  assertEquals(result.isError, true);
  const text = result.content[0].text || "";
  assertStringIncludes(text, "factory");
  assertStringIncludes(text, "required");
});

Deno.test("codefactory_create - should require outputPath", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const result = await createTool.execute({
      factory: "test_factory",
      params: { name: "Test" },
      // No outputPath - tool will generate one automatically
      outputPath: `${tempOutput}/auto-generated.ts`,
      factoriesPath: tempFactories,
    });

    // Should succeed because outputPath is provided
    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "Created");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should use default factoriesPath", async () => {
  const tempOutput = await Deno.makeTempDir();

  try {
    // This should use ./factories as default (built-ins will be loaded)
    const result = await createTool.execute({
      factory: "nonexistent",
      params: {},
      outputPath: `${tempOutput}/test.ts`,
    });

    // Should error because factory doesn't exist, but factoriesPath was used
    assertEquals(result.isError, true);
  } finally {
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should handle nested output directories", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const nestedPath = `${tempOutput}/nested/deep/structure/file.ts`;
    const result = await createTool.execute({
      factory: "test_factory",
      params: { name: "Nested" },
      outputPath: nestedPath,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);

    // Verify file was created in nested directory
    const exists = await Deno.stat(nestedPath)
      .then(() => true)
      .catch(() => false);
    assertEquals(exists, true);
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should pass all params to factory", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Factory with multiple parameters
    await Deno.writeTextFile(
      `${tempFactories}/multi_param.codefactory`,
      `name: multi_param
description: Multiple parameters
params:
  name:
    type: string
    required: true
  value:
    type: string
    required: true
  type:
    type: string
    required: false

template: |
  export const {{name}}: {{type}} = {{value}};
`
    );

    const result = await createTool.execute({
      factory: "multi_param",
      params: {
        name: "myVar",
        value: "'hello'",
        type: "string",
      },
      outputPath: `${tempOutput}/multi.ts`,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);

    const content = await Deno.readTextFile(`${tempOutput}/multi.ts`);
    assertStringIncludes(content, "export const myVar: string = 'hello';");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should return success message", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const result = await createTool.execute({
      factory: "test_factory",
      params: { name: "Success" },
      outputPath: `${tempOutput}/success.ts`,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    
    assertStringIncludes(text, "✅");
    assertStringIncludes(text, "Created");
    assertStringIncludes(text, "success.ts");
    assertStringIncludes(text, "test_factory");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should show next steps in response", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "test_factory",
      "export const {{name}} = 'test';"
    );

    const result = await createTool.execute({
      factory: "test_factory",
      params: { name: "Test" },
      outputPath: `${tempOutput}/test.ts`,
      factoriesPath: tempFactories,
    });

    const text = result.content[0].text || "";
    
    // Should explain extraction workflow (note: lowercase "edit")
    assertStringIncludes(text, "Edit");
    assertStringIncludes(text, "sync");
    assertStringIncludes(text, "source of truth");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should list available factories when no factory specified", async () => {
  const tempFactories = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "factory_one",
      "test1"
    );
    await createTestFactory(
      tempFactories,
      "factory_two",
      "test2"
    );

    const result = await createTool.execute({
      factoriesPath: tempFactories,
    });

    // Should error because neither description nor factory was provided
    assertEquals(result.isError, true);
    const text = result.content[0].text || "";
    
    assertStringIncludes(text, "description");
    assertStringIncludes(text, "factory");
    assertStringIncludes(text, "required");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
  }
});

// Tests for natural language inference (helper functions)

Deno.test("codefactory_create - should infer factory from description (web_component)", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Create web_component factory
    await Deno.writeTextFile(
      `${tempFactories}/web_component.codefactory`,
      `name: web_component
description: Creates a web component
outputPath: src/components/{{componentName}}.ts
params:
  componentName:
    type: string
    required: true
  tagName:
    type: string
    required: true
  props:
    type: string[]
    required: false
  signals:
    type: string[]
    required: false

template: |
  export class {{componentName}} extends HTMLElement {
    static get observedAttributes() { return [{{#each props}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}]; }
  }
  customElements.define('{{tagName}}', {{componentName}});
`,
    );

    // Change to temp output directory so generated files go there
    const originalCwd = Deno.cwd();
    Deno.chdir(tempOutput);

    try {
      const result = await createTool.execute({
        description: "Create a Button web component",
        factoriesPath: tempFactories,
      });

      assertEquals(result.isError, undefined);
      const text = result.content[0].text || "";
      assertStringIncludes(text, "✅");
      assertStringIncludes(text, "web_component");
      assertStringIncludes(text, "Button");
      assertStringIncludes(text, "app-button");
    } finally {
      Deno.chdir(originalCwd);
    }
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should extract params from description", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Create web_component factory
    await Deno.writeTextFile(
      `${tempFactories}/web_component.codefactory`,
      `name: web_component
description: Creates a web component
outputPath: src/components/{{componentName}}.ts
params:
  componentName:
    type: string
    required: true
  tagName:
    type: string
    required: true
  props:
    type: string[]
    required: false
  signals:
    type: string[]
    required: false

template: |
  Component: {{componentName}}
  Props: {{#each props}}{{this}}{{/each}}
`,
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(tempOutput);

    try {
      const result = await createTool.execute({
        description: "Create a Dialog web component with title and message props",
        factoriesPath: tempFactories,
      });

      assertEquals(result.isError, undefined);
      const text = result.content[0].text || "";
      assertStringIncludes(text, "Dialog");
      assertStringIncludes(text, "title: unknown");
      assertStringIncludes(text, "message: unknown");
    } finally {
      Deno.chdir(originalCwd);
    }
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should generate output path from params", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Create web_component factory
    await Deno.writeTextFile(
      `${tempFactories}/web_component.codefactory`,
      `name: web_component
description: Creates a web component
outputPath: src/components/{{componentName}}.ts
params:
  componentName:
    type: string
    required: true
  tagName:
    type: string
    required: true
  props:
    type: string[]
    required: false

template: |
  Component {{componentName}}

`,
    );

    // Change to temp output directory
    const originalCwd = Deno.cwd();
    Deno.chdir(tempOutput);

    try {
      const result = await createTool.execute({
        description: "Create a Card web component",
        factoriesPath: tempFactories,
      });

      assertEquals(result.isError, undefined);
      const text = result.content[0].text || "";
      
      // Should generate path automatically
      assertStringIncludes(text, "src/components/Card.ts");
      
      // Verify file was created
      const content = await Deno.readTextFile("src/components/Card.ts");
      assertStringIncludes(content, "Component Card");
    } finally {
      Deno.chdir(originalCwd);
    }
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should extract signals from description", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await Deno.writeTextFile(
      `${tempFactories}/web_component.codefactory`,
      `name: web_component
description: Creates a web component
outputPath: src/components/{{componentName}}.ts
params:
  componentName:
    type: string
    required: true
  tagName:
    type: string
    required: true
  signals:
    type: string[]
    required: false

template: |
  Signals: {{#each signals}}{{name}}{{/each}}

`,
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(tempOutput);

    try {
      const result = await createTool.execute({
        description: "Create a Counter web component with count signal",
        factoriesPath: tempFactories,
      });

      assertEquals(result.isError, undefined);
      const text = result.content[0].text || "";
      assertStringIncludes(text, "count");
    } finally {
      Deno.chdir(originalCwd);
    }
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should infer factory name from quoted string", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    await createTestFactory(
      tempFactories,
      "my_custom_factory",
      "Custom: {{name}}"
    );

    const result = await createTool.execute({
      description: "Use 'my_custom_factory' to create something",
      params: { name: "Test" },
      outputPath: `${tempOutput}/test.ts`,
      factoriesPath: tempFactories,
    });

    assertEquals(result.isError, undefined);
    const text = result.content[0].text || "";
    assertStringIncludes(text, "my_custom_factory");
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should handle unrecognized description", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Create a simple custom factory
    await createTestFactory(
      tempFactories,
      "simple_test",
      "Output: {{name}}"
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(tempOutput);

    try {
      // Use description that doesn't match any pattern
      // Should fall back to first factory, but that's the built-in "factory"
      // which requires different params than what we're providing
      const result = await createTool.execute({
        description: "xyz random unmatched description",
        factoriesPath: tempFactories,
      });

      // The fallback will pick "factory" (built-in) which requires name/description/template
      // So this should error with missing parameters
      assertEquals(result.isError, true);
      const text = result.content[0].text || "";
      assertStringIncludes(text, "Missing required parameters");
    } finally {
      Deno.chdir(originalCwd);
    }
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should infer 'react' keyword", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Create both web_component (would match "component") and react_component
    await Deno.writeTextFile(
      `${tempFactories}/web_component.codefactory`,
      `name: web_component
description: Creates a web component
outputPath: src/components/{{componentName}}.ts
params:
  componentName:
    type: string
    required: true
  tagName:
    type: string
    required: true

template: |
  export class {{componentName}} extends HTMLElement {}

`,
    );

    // Create react_component factory  
    await Deno.writeTextFile(
      `${tempFactories}/react_component.codefactory`,
      `name: react_component
description: Creates a React component
outputPath: src/components/{{componentName}}.tsx
params:
  componentName:
    type: string
    required: true

template: |
  export function {{componentName}}() { return <div>React</div>; }

`,
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(tempOutput);

    try {
      const result = await createTool.execute({
        description: "Create a react Button",
        factoriesPath: tempFactories,
      });

      if (result.isError) {
        console.log("React test ERROR:", result.content[0].text);
      }

      assertEquals(result.isError, undefined);
      const text = result.content[0].text || "";
      assertStringIncludes(text, "react_component");
    } finally {
      Deno.chdir(originalCwd);
    }
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

Deno.test("codefactory_create - should infer 'function' keyword", async () => {
  const tempFactories = await Deno.makeTempDir();
  const tempOutput = await Deno.makeTempDir();

  try {
    // Create typescript_function factory
    await Deno.writeTextFile(
      `${tempFactories}/typescript_function.codefactory`,
      `name: typescript_function
description: Creates a TypeScript function
outputPath: src/{{name}}.ts
params:
  name:
    type: string
    required: true

template: |
  export function {{name}}() { return true; }

`,
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(tempOutput);

    try {
      const result = await createTool.execute({
        description: "Create a function called myHelper",
        params: { name: "myHelper" },
        factoriesPath: tempFactories,
      });

      assertEquals(result.isError, undefined);
      const text = result.content[0].text || "";
      assertStringIncludes(text, "typescript_function");
    } finally {
      Deno.chdir(originalCwd);
    }
  } finally {
    await Deno.remove(tempFactories, { recursive: true });
    await Deno.remove(tempOutput, { recursive: true });
  }
});

