/**
 * Utility for loading and working with manifests
 */

import { ManifestManager } from "@codefactory/core";

/**
 * Default manifest file path
 */
const DEFAULT_MANIFEST_PATH = "./codefactory.manifest.json";

/**
 * Get manifest path from environment or use default
 */
export function getManifestPath(): string {
  return Deno.env.get("CODEFACTORY_MANIFEST") ?? DEFAULT_MANIFEST_PATH;
}

/**
 * Load the manifest from disk
 */
export async function loadManifest(): Promise<ManifestManager> {
  const path = getManifestPath();
  return await ManifestManager.load(path);
}
