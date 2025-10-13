/**
 * Template engine for simple variable substitution
 * Supports {{variable}} syntax
 */
export function renderTemplate(template: string, variables: Record<string, unknown>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(placeholder, String(value ?? ""));
  }
  
  return result;
}

/**
 * Parse template to find all variable placeholders
 */
export function parseTemplateVariables(template: string): string[] {
  const regex = /{{\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*}}/g;
  const variables = new Set<string>();
  
  let match;
  while ((match = regex.exec(template)) !== null) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
}
