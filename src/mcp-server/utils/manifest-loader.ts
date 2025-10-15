/**
 * Utility for loading and working with manifests
 */

import { ManifestManager } from "@codefactory/core";

/**
 * Default manifest file path
 */
const DEFAULT_MANIFEST_PATH = "./codefactory.manifest.json";

/**
 * Get manifest path from args, environment, or use default
 */
export function getManifestPath(customPath?: string): string {
  return customPath ?? Deno.env.get("CODEFACTORY_MANIFEST") ?? DEFAULT_MANIFEST_PATH;
}

/**
 * Load the manifest from disk
 */
export async function loadManifest(customPath?: string): Promise<ManifestManager> {
  const path = getManifestPath(customPath);
  return await ManifestManager.load(path);
}
