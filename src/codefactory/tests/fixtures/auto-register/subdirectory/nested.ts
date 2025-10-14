import type { FactoryDefinition } from "../../../../types.ts";

export const nestedFactory: FactoryDefinition = {
  name: "nested_factory",
  description: "A factory in subdirectory",
  params: {},
  generate: () => ({ content: "nested" }),
};
