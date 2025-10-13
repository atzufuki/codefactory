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
- ✅ **Project structure** following best practices
- ✅ **Built-in factories** including the meta-factory

## Project Structure

```
my-app/
├── factories/         # Your code generation templates
│   ├── index.ts       # Factory registry
│   └── examples.ts    # Example factories
├── src/
│   └── main.ts        # Application entry point
├── deno.json          # Deno configuration
└── README.md          # Project documentation
```

## Learn More

- [CodeFactory Documentation](https://github.com/atzufuki/codefactory)
- [Defining Factories](https://github.com/atzufuki/codefactory#defining-factories)

## License

MIT
