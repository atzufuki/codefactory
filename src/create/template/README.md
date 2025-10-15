# My CodeFactory Project

A project using [CodeFactory](https://github.com/atzufuki/codefactory) for deterministic code generation.

## Quick Start

### 1. Create a Factory

Use the built-in `factory` meta-factory to create new code generators:

```bash
# With GitHub Copilot:
/codefactory.add "a 'factory' for TypeScript function with params and return type"
/codefactory.produce

# This creates: factories/typescript_function.hbs
```

### 2. Use Your Factory

```bash
/codefactory.add "a 'typescript_function' for calculateTotal"
/codefactory.produce

# This creates: src/calculateTotal.ts
```

### 3. Learn More

- [User Guide](https://github.com/atzufuki/codefactory/blob/main/docs/for-users.md) - Copilot commands
- [Creating Factories](https://github.com/atzufuki/codefactory/blob/main/docs/creating-factories.md) - Factory guide
- [Manifest System](https://github.com/atzufuki/codefactory/blob/main/docs/manifest-system.md) - How it works

## What is CodeFactory?

Two-phase code generation:
1. **Plan** (with AI): Add factory calls to `codefactory.manifest.json`
2. **Build** (deterministic): Execute manifest → Generate code

**Benefits:**
- Same manifest = Same code, always
- Fast rebuilds without AI
- Version control the "recipe"
- Factory updates benefit all code

## Available Commands

```bash
/codefactory.add <description>       # Add to manifest (planning)
/codefactory.produce                 # Build from manifest
/codefactory.update <id> <changes>   # Update factory call
/codefactory.remove <id>             # Remove factory call
/codefactory.inspect                 # Show manifest
```

---

**Built with Deno 🦕 and CodeFactory 🏭**
