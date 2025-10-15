# create-codefactory

> Scaffolding CLI for CodeFactory projects

Bootstrap a new project with CodeFactory already set up.

## Usage

Use `--reload` to make sure to use the latest template.

```bash
deno run --reload jsr:@codefactory/create <project-name>
```

Or, if installed globally:

```bash
create-codefactory <project-name>
```

## Example

```bash
deno run jsr:@codefactory/create my-app
cd my-app
deno task dev
```

## What You Get

The scaffolded project includes:

- ✅ **CodeFactory** library pre-installed
- ✅ **Factory registry** ready to use
- ✅ **Example factories** to get started
- ✅ **MCP Server** configuration for AI assistants (GitHub Copilot, Claude)
- ✅ **GitHub Copilot** slash commands pre-configured
- ✅ **Project structure** following best practices
- ✅ **Built-in factories** including the meta-factory

## Project Structure

```
my-app/
├── .vscode/
│   ├── mcp.json           # MCP server configuration for AI assistants
│   └── settings.json      # VS Code settings
├── .github/
│   └── prompts/           # GitHub Copilot slash commands
│       ├── codefactory.add.prompt.md
│       ├── codefactory.produce.prompt.md
│       └── ...
├── factories/             # Your code generation templates
│   ├── index.ts          # Factory registry
│   └── examples.ts       # Example factories
├── src/
│   └── main.ts           # Application entry point
├── codefactory.manifest.json  # Factory calls manifest
├── deno.json             # Deno configuration
└── README.md             # Project documentation
```

## Learn More

- [CodeFactory Documentation](https://github.com/atzufuki/codefactory)
- [MCP Setup Guide](../../docs/mcp-setup.md) - Configure AI assistant integration
- [Creating Factories](../../docs/creating-factories.md) - Define your own code generators
- [Manifest System](../../docs/manifest-system.md) - Two-phase code generation

## License

MIT
