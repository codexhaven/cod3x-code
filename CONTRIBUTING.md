# Contributing to Cod3x Code

Thank you for your interest in contributing to Cod3x Code by CodexHaven! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- Git
- npm >= 9.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/codexhaven/cod3x-code.git
cd cod3x-code

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build
```

## Project Architecture

### Adding a New Tool

Tools are located in `src/tools/<category>/<tool-name>.ts`. Each tool exports a `definition` object:

```typescript
import { ToolDefinition } from '@codex-types/index';

export const definition: ToolDefinition = {
  name: 'my_tool',
  description: 'What this tool does',
  category: 'utility',
  requiresApproval: false,
  parameters: [
    { name: 'param1', type: 'string', description: 'Parameter description', required: true },
  ],
  handler: async (params, context) => {
    const param1 = params.param1 as string;
    try {
      // Tool implementation
      return { success: true, output: 'Result', data: { param1 } };
    } catch (error) {
      return { success: false, output: '', error: (error as Error).message };
    }
  },
};
```

Then register it in `src/core/tool-registry.ts`.

### Adding a New Agent

Agents are defined in `src/agents/orchestrator.ts` in the `initializeDefaultAgents()` method:

```typescript
{
  id: 'my-agent',
  name: 'My Agent',
  description: 'What this agent does',
  role: 'my-role',
  systemPrompt: 'System prompt for the agent...',
  tools: ['tool1', 'tool2'],
  execute: this.createAgentExecutor('my-role'),
}
```

### Adding a New LLM Provider

1. Create a new file in `src/llm/<name>-provider.ts`
2. Implement the `LLMProvider` interface
3. Register it in `src/llm/provider.ts`

## Code Style

- TypeScript strict mode enabled
- Use async/await for asynchronous code
- Handle errors gracefully with try/catch
- Include JSDoc comments for public APIs
- Follow existing naming conventions

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests and ensure they pass
5. Update documentation if needed
6. Submit a pull request

## Code of Conduct

Be respectful and constructive. We welcome contributors of all experience levels.

## Questions?

Open an issue on GitHub or join the discussion.
