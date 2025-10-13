# AI Code Factory - Copilot Instructions

This project is building a meta-factory system for AI code generation using Deno 2 and TypeScript.

## Project Overview
- **Language**: TypeScript (Deno 2)
- **Purpose**: A library that allows developers to define deterministic code generation templates (factories) that AI assistants can use instead of writing code directly
- **Key Concept**: Reduce AI variability by having AI call predefined factories with parameters, rather than writing code from scratch

## Development Guidelines
- Use Deno 2 APIs and conventions
- Focus on TypeScript type safety
- Keep the API simple and intuitive for developers
- Prioritize deterministic output over flexibility
- Design for composition (factories can call other factories)

## Architecture Principles
1. **Factory Definition**: Simple way for developers to define code generation templates
2. **Parameter Validation**: Strong typing and validation before code generation
3. **Composability**: Factories can reference and use other factories
4. **Language Agnostic Output**: Factories can generate code in any language
5. **AI Integration**: Clear protocol for AI to discover and use factories
