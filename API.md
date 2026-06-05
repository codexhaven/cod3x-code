# Cod3x Code v4.0 - API Documentation

## REST API

The web server (`server.mjs`) exposes a REST API on port 9000 by default.

### Base URL

```
http://localhost:9000/api
```

### Authentication

No authentication required for local usage. For production deployments, add a reverse proxy with authentication.

### Endpoints

#### GET /api/status

Returns server status and configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "4.0.0",
    "platform": "linux",
    "tools": 70,
    "agents": 14,
    "llm": {
      "provider": "opencode-proxy",
      "model": "claude-sonnet-4",
      "available": ["opencode-proxy", "anthropic"]
    },
    "uptime": 3600000,
    "requests": 42,
    "sessions": 3
  }
}
```

#### GET /api/tools

Returns all available tools.

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 70,
    "tools": [
      {
        "name": "read_file",
        "description": "Read file contents with encoding, offset, and limit support",
        "category": "filesystem",
        "requiresApproval": false,
        "parameters": [...]
      }
    ]
  }
}
```

#### GET /api/agents

Returns all available agents.

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 14,
    "agents": [
      {
        "id": "code-gen",
        "name": "Code Generator",
        "role": "code-generator",
        "description": "Generate production-ready code from specifications",
        "tools": ["write_file", "read_file", "edit_file", "bash"]
      }
    ]
  }
}
```

#### POST /api/chat

Send a message and get a response.

**Request:**
```json
{
  "message": "Hello, analyze this project",
  "sessionId": "optional-session-id",
  "model": "optional-model-override",
  "temperature": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Analysis complete...",
    "type": "chat"
  }
}
```

Special message prefixes:
- `!agent <role> <task>` - Run a specific agent
- `!swarm <objective>` - Execute with swarm mode

#### POST /api/swarm

Execute a task with swarm agents.

**Request:**
```json
{
  "objective": "Refactor the auth module",
  "context": "Optional context"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "output": "Combined agent outputs...",
    "summary": "Swarm completed 5/5 tasks in 12.3s",
    "duration": 12300,
    "tokensUsed": 15000
  }
}
```

#### POST /api/tool/:name

Execute a specific tool.

**Request:**
```json
{
  "params": {
    "path": "./README.md"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "output": "File contents...",
    "data": { "path": "./README.md", "lines": 100 }
  }
}
```

#### GET /api/config

Returns current configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "my-project",
    "model": "claude-sonnet-4",
    "provider": "opencode-proxy",
    "temperature": 0.7,
    "maxTokens": 8192,
    "platform": "linux"
  }
}
```

## JavaScript/TypeScript API

You can also use Cod3x programmatically:

```typescript
import { ConfigLoader } from 'cod3x-code/dist/config/loader.js';
import { ToolRegistry } from 'cod3x-code/dist/core/tool-registry.js';
import { AgentOrchestrator } from 'cod3x-code/dist/agents/orchestrator.js';
import { LLMProviderFactory } from 'cod3x-code/dist/llm/provider.js';
import { Logger } from 'cod3x-code/dist/utils/logger.js';

async function main() {
  const config = await new ConfigLoader().load();
  const logger = new Logger(config.logging);
  const tools = new ToolRegistry();
  const llm = new LLMProviderFactory(config, logger);
  const agents = new AgentOrchestrator(config.agents, llm.getPrimary(), logger, tools);

  await tools.loadDefaults();

  // Execute an agent
  const result = await agents.executeAgent('code-gen', {
    id: 'task-1',
    description: 'Create a user authentication module',
  });

  console.log(result.output);

  // Execute swarm
  const swarmResult = await agents.executeSwarm(
    'Build a complete REST API with auth, tests, and docs'
  );

  console.log(swarmResult.output);

  // Execute tool directly
  const toolResult = await tools.execute('read_file', { path: './package.json' });
  console.log(toolResult.output);

  // Agent chaining
  const chainResults = await agents.executeChain([
    { task: { id: '1', description: 'Review code' }, agentId: 'code-review' },
    { task: { id: '2', description: 'Fix issues' }, agentId: 'debugger', usePreviousOutput: true },
  ]);
}
```

## WebSocket API (Planned)

Future versions will support WebSocket connections for real-time streaming.

## Error Codes

| Code | Description |
|------|-------------|
| `PROVIDER_UNAVAILABLE` | LLM provider is not available |
| `AGENT_NOT_FOUND` | Agent ID does not exist |
| `TOOL_NOT_FOUND` | Tool name does not exist |
| `PERMISSION_DENIED` | Operation blocked by permission settings |
| `TIMEOUT` | Operation timed out |
| `BUILD_REQUIRED` | dist/ folder missing, run `npm run build` |
