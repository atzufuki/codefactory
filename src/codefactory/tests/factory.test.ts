/**
 * Tests for Factory class
 */

import { assertEquals } from "@std/assert";
import { Factory } from "../factory.ts";
import type { FactoryDefinition } from "../types.ts";

Deno.test("Factory - should get template", () => {
  const definition: FactoryDefinition = {
    name: "test",
    description: "Test factory",
    params: {},
    template: "export const {{name}} = 'test';",
    generate: () => Promise.resolve({ content: "" }),
  };

  const factory = new Factory(definition);
  assertEquals(factory.template, "export const {{name}} = 'test';");
});

Deno.test("Factory - should create factory using static define method", () => {
  const definition: FactoryDefinition = {
    name: "test",
    description: "Test factory",
    params: {},
    generate: () => Promise.resolve({ content: "test" }),
  };

  const factory = Factory.define(definition);
  assertEquals(factory.getMetadata().name, "test");
  assertEquals(factory.getMetadata().description, "Test factory");
});
