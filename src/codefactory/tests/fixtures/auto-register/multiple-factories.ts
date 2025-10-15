import type { FactoryDefinition } from "../../../types.ts";

export const factory1: FactoryDefinition = {
  name: "factory_one",
  description: "First factory",
  params: {},
  generate: () => ({ content: "factory 1" }),
};

export const factory2: FactoryDefinition = {
  name: "factory_two",
  description: "Second factory",
  params: {},
  generate: () => ({ content: "factory 2" }),
};

