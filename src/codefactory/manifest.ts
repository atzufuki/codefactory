/**
 * Build Manifest System
 * 
 * Manages factory calls and their execution order for deterministic code generation.
 */

export interface FactoryCall {
  /** Unique identifier for this factory call */
  id: string;
  /** Name of the factory to execute */
  factory: string;
  /** Parameters to pass to the factory (must be JSON-serializable) */
  params: Record<string, unknown>;
  /** Path where code will be generated */
  outputPath: string;
  /** ISO timestamp when this call was created */
  createdAt: string;
  /** Version of the factory used (optional) */
  factoryVersion?: string;
  /** IDs of other factory calls this depends on (optional) */
  dependsOn?: string[];
}

export interface BuildManifest {
  /** Manifest format version */
  version: string;
  /** ISO timestamp of last build */
  generated: string;
  /** All factory calls in this project */
  factories: FactoryCall[];
}

export class ManifestManager {
  private manifest: BuildManifest;
  private manifestPath: string;

  constructor(manifestPath: string, manifest?: BuildManifest) {
    this.manifestPath = manifestPath;
    this.manifest = manifest ?? {
      version: "1.0.0",
      generated: new Date().toISOString(),
      factories: [],
    };
  }

  /**
   * Add a new factory call to the manifest
   */
  addFactoryCall(call: Omit<FactoryCall, "createdAt">): void {
    // Check for duplicate ID
    if (this.manifest.factories.some((f) => f.id === call.id)) {
      throw new Error(`Factory call with id "${call.id}" already exists in manifest`);
    }

    // Check if dependencies exist
    if (call.dependsOn) {
      for (const depId of call.dependsOn) {
        if (!this.manifest.factories.some((f) => f.id === depId)) {
          throw new Error(`Dependency "${depId}" not found in manifest`);
        }
      }
    }

    const factoryCall: FactoryCall = {
      ...call,
      createdAt: new Date().toISOString(),
    };

    this.manifest.factories.push(factoryCall);
  }

  /**
   * Remove a factory call by ID
   */
  removeFactoryCall(id: string): void {
    const index = this.manifest.factories.findIndex((f) => f.id === id);
    
    if (index === -1) {
      throw new Error(`Factory call "${id}" not found in manifest`);
    }

    // Check if other factories depend on this one
    const dependents = this.manifest.factories.filter(
      (f) => f.dependsOn?.includes(id)
    );

    if (dependents.length > 0) {
      const dependentIds = dependents.map((f) => f.id).join(", ");
      throw new Error(
        `Cannot remove "${id}" - other factories depend on it: ${dependentIds}`
      );
    }

    this.manifest.factories.splice(index, 1);
  }

  /**
   * Update an existing factory call
   */
  updateFactoryCall(id: string, updates: Partial<Omit<FactoryCall, "id" | "createdAt">>): void {
    const factoryCall = this.manifest.factories.find((f) => f.id === id);

    if (!factoryCall) {
      throw new Error(`Factory call "${id}" not found in manifest`);
    }

    // Check if new dependencies exist
    if (updates.dependsOn) {
      for (const depId of updates.dependsOn) {
        if (depId !== id && !this.manifest.factories.some((f) => f.id === depId)) {
          throw new Error(`Dependency "${depId}" not found in manifest`);
        }
      }

      // Check for circular dependencies
      if (updates.dependsOn.includes(id)) {
        throw new Error(`Factory call "${id}" cannot depend on itself`);
      }
    }

    Object.assign(factoryCall, updates);
  }

  /**
   * Get a factory call by ID
   */
  getFactoryCall(id: string): FactoryCall | undefined {
    return this.manifest.factories.find((f) => f.id === id);
  }

  /**
   * Get all factory calls
   */
  getAllFactoryCalls(): FactoryCall[] {
    return [...this.manifest.factories];
  }

  /**
   * Get execution order based on dependencies (topological sort)
   */
  getExecutionOrder(): FactoryCall[] {
    const calls = [...this.manifest.factories];
    const sorted: FactoryCall[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (call: FactoryCall) => {
      if (visited.has(call.id)) {
        return;
      }

      if (visiting.has(call.id)) {
        throw new Error(`Circular dependency detected involving "${call.id}"`);
      }

      visiting.add(call.id);

      // Visit dependencies first
      if (call.dependsOn) {
        for (const depId of call.dependsOn) {
          const depCall = calls.find((c) => c.id === depId);
          if (!depCall) {
            throw new Error(`Dependency "${depId}" not found for "${call.id}"`);
          }
          visit(depCall);
        }
      }

      visiting.delete(call.id);
      visited.add(call.id);
      sorted.push(call);
    };

    for (const call of calls) {
      visit(call);
    }

    return sorted;
  }

  /**
   * Update the generated timestamp
   */
  updateGeneratedTimestamp(): void {
    this.manifest.generated = new Date().toISOString();
  }

  /**
   * Get the manifest object
   */
  getManifest(): BuildManifest {
    return { ...this.manifest };
  }

  /**
   * Save manifest to disk
   */
  async save(): Promise<void> {
    const content = JSON.stringify(this.manifest, null, 2);
    await Deno.writeTextFile(this.manifestPath, content);
  }

  /**
   * Load manifest from disk
   */
  static async load(path: string): Promise<ManifestManager> {
    try {
      const content = await Deno.readTextFile(path);
      const manifest: BuildManifest = JSON.parse(content);
      
      // Validate manifest structure
      if (!manifest.version || !manifest.generated || !Array.isArray(manifest.factories)) {
        throw new Error("Invalid manifest format");
      }

      return new ManifestManager(path, manifest);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // Create new manifest if file doesn't exist
        return new ManifestManager(path);
      }
      throw error;
    }
  }

  /**
   * Create a new empty manifest file
   */
  static async create(path: string): Promise<ManifestManager> {
    const manager = new ManifestManager(path);
    await manager.save();
    return manager;
  }
}
