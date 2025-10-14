// This file should be skipped in auto-registration
import type { FactoryDefinition } from "../../../types.ts";

export const shouldBeIgnored: FactoryDefinition = {
  name: "should_not_register",
  description: "Should not be registered",
  params: {},
  generate: () => ({ content: "ignored" }),
};
