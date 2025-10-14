import type { FactoryDefinition } from "../../../types.ts";

export const factoryWithSuffix: FactoryDefinition = {
  name: "factory_with_suffix",
  description: "Factory with .factory.ts suffix",
  params: {},
  generate: () => ({ content: "with suffix" }),
};
