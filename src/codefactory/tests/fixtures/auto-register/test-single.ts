import type { FactoryDefinition } from "../../../types.ts";

export const testFactory: FactoryDefinition = {
  name: "test_factory",
  description: "A test factory",
  params: {},
  generate: () => ({ content: "test content" }),
};
