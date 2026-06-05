/**
 * ═══════════════════════════════════════════════════════════════
 * Cod3x Code v4.0 - Core Type Definitions
 * Developed by CodexHaven - https://github.com/codexhaven/cod3x-code
 * ═══════════════════════════════════════════════════════════════
 */

import { ReactElement } from 'react';

// ─── Platform Types ───

export type PlatformType = 'termux' | 'linux' | 'win32' | 'darwin' | 'android' | 'unknown';

export interface PlatformInfo {
  type: PlatformType;
  isTermux: boolean;
  isMobile: boolean;
  isWindows: boolean;
  isLinux: boolean;
  isMac: boolean;
  shell: string;
  homeDir: string;
  tempDir: string;
  nodeVersion: string;
  supportsGUI: boolean;
  supportsPuppeteer: boolean;
  maxConcurrency: number;
}

// ─── LLM Types ───

export type LLMProviderType = 'opencode-proxy' | 'anthropic' | 'openai' | 'google' | 'openrouter' | 'custom';

export interface LLMProvider {
  id: LLMProviderType;
  name: string;
  models: string[];
  chat(messages: ChatMessage[], options?: LLMOptions): Promise<string>;
  stream(messages: ChatMessage[], onToken: (token: string) => void, options?: LLMOptions): Promise<string>;
  countTokens(text: string): number;
  isAvailable(): Promise<boolean>;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  tools?: ToolDefinition[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

// ─── Tool Types ───

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  category: ToolCategory;
  requiresApproval: boolean;
  platforms?: PlatformType[];
  handler: ToolHandler;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: string[];
}

export type ToolCategory =
  | 'filesystem'
  | 'execution'
  | 'search'
  | 'git'
  | 'code'
  | 'analysis'
  | 'network'
  | 'database'
  | 'documentation'
  | 'testing'
  | 'utility'
  | 'browser'
  | 'debug'
  | 'ai'
  | 'project';

export type ToolHandler = (params: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;

export interface ToolContext {
  cwd: string;
  permissions: PermissionManager;
  logger: Logger;
  config: Config;
  platform: PlatformInfo;
  llm: LLMProvider;
}

export interface ToolResult {
  success: boolean;
  output: string;
  data?: unknown;
  error?: string;
  exitCode?: number;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

// ─── Agent Types ───

export interface Agent {
  id: string;
  name: string;
  description: string;
  role: AgentRole;
  systemPrompt: string;
  tools: string[];
  model?: string;
  execute(task: AgentTask): Promise<AgentResult>;
}

export type AgentRole =
  | 'code-generator'
  | 'code-reviewer'
  | 'debugger'
  | 'architect'
  | 'tester'
  | 'documenter'
  | 'git-manager'
  | 'security-auditor'
  | 'optimizer'
  | 'browser'
  | 'swarm-leader'
  | 'task-decomposer'
  | 'error-analyst'
  | 'trail-runner';

export interface AgentTask {
  id: string;
  description: string;
  context?: string;
  files?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[];
  maxIterations?: number;
}

export interface AgentResult {
  success: boolean;
  output: string;
  files?: string[];
  changes?: FileChange[];
  summary: string;
  tokensUsed?: number;
  duration?: number;
}

// ─── Swarm Types ───

export type SwarmStrategy = 'sequential' | 'parallel' | 'priority' | 'dependency' | 'round-robin';

export interface SwarmConfig {
  maxConcurrent: number;
  strategy: SwarmStrategy;
  timeout: number;
  retryAttempts: number;
  enabled: boolean;
}

export interface Swarm {
  id: string;
  config: SwarmConfig;
  agents: Agent[];
  tasks: SwarmTask[];
  status: SwarmStatus;
  execute(tasks: AgentTask[]): Promise<SwarmResult>;
}

export interface SwarmTask {
  id: string;
  task: AgentTask;
  agent: string;
  status: TaskStatus;
  dependencies: string[];
  startedAt?: Date;
  completedAt?: Date;
  result?: AgentResult;
}

export type TaskStatus = 'pending' | 'queued' | 'running' | 'waiting_for_dependency' | 'completed' | 'failed' | 'cancelled' | 'retrying';

export type SwarmStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface SwarmResult {
  success: boolean;
  tasks: SwarmTask[];
  summary: string;
  duration: number;
  tokensUsed: number;
}

export interface TaskGraph {
  nodes: TaskNode[];
  edges: TaskEdge[];
}

export interface TaskNode {
  id: string;
  task: AgentTask;
  status: TaskStatus;
}

export interface TaskEdge {
  from: string;
  to: string;
  type: 'depends_on' | 'triggers' | 'parallel_with';
}

// ─── Configuration Types ───

export interface Config {
  name: string;
  version: string;
  platform: PlatformConfig;
  permissions: PermissionConfig;
  context: ContextConfig;
  ai: AIConfig;
  mcp: MCPConfig;
  hooks: HooksConfig;
  ide: IDEConfig;
  ui: UIConfig;
  logging: LoggingConfig;
  features: FeaturesConfig;
  limits: LimitsConfig;
  agents: AgentsConfig;
  swarm: SwarmConfig;
  browser: BrowserConfig;
  debug: DebugConfig;
}

export interface PlatformConfig {
  type: PlatformType;
  autoDetect: boolean;
  shell: string;
  maxConcurrency: number;
  adaptForMobile: boolean;
}

export interface PermissionConfig {
  askBeforeBash: boolean;
  askBeforeWrite: boolean;
  askBeforeDelete: boolean;
  askBeforeNetwork: boolean;
  autoApprovePatterns: string[];
  autoDenyPatterns: string[];
  blockedCommands: string[];
  allowedPaths: string[];
  shell?: string;
}

export interface ContextConfig {
  maxFiles: number;
  includePatterns: string[];
  excludePatterns: string[];
  gitEnabled: boolean;
  followSymlinks: boolean;
  indexContent: boolean;
  respectGitignore: boolean;
}

export interface AIConfig {
  provider: LLMProviderType;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt?: string;
  fallbackProvider?: LLMProviderType;
  fallbackModel?: string;
  customBaseURL?: string;
  customApiKey?: string;
  opencodeProxyURL?: string;
}

export interface BrowserConfig {
  enabled: boolean;
  headless: boolean;
  defaultTimeout: number;
  userAgent?: string;
  proxy?: string;
}

export interface DebugConfig {
  enabled: boolean;
  trailEnabled: boolean;
  autoBreakpoints: boolean;
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  captureStackTrace: boolean;
}

export interface MCPConfig {
  enabled: boolean;
  port: number;
  host: string;
  autoStart: boolean;
  servers: MCPServerConfig[];
  authToken?: string;
}

export interface MCPServerConfig {
  name: string;
  url: string;
  tools: string[];
  auth?: {
    type: 'bearer' | 'basic';
    token?: string;
    username?: string;
    password?: string;
  };
}

export interface HooksConfig {
  preTool: boolean;
  postTool: boolean;
  onError: boolean;
  customHooksPath?: string;
}

export interface IDEConfig {
  enabled: boolean;
  vscode: boolean;
  autoOpenFiles: boolean;
  inlineSuggestions: boolean;
  syncSettings: boolean;
}

export interface UIConfig {
  theme: string;
  showLineNumbers: boolean;
  syntaxHighlight: boolean;
  compactMode: boolean;
  streaming: boolean;
  colors: Record<string, string>;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  file: string;
  maxSize: string;
  maxFiles: number;
  console: boolean;
  jsonFormat: boolean;
}

export interface FeaturesConfig {
  autoCompact: boolean;
  suggestImprovements: boolean;
  trackUsage: boolean;
  telemetry: boolean;
  autoSave: boolean;
  autoComplete: boolean;
  gitWorkflow: boolean;
  fileWatching: boolean;
  multiAgent: boolean;
  streaming: boolean;
  swarmAgents: boolean;
  browser: boolean;
  debugTrail: boolean;
}

export interface LimitsConfig {
  maxFileSize: number;
  maxOutputSize: number;
  maxSearchResults: number;
  maxConversationAge: number;
  maxTokenUsage: number;
  maxToolCalls: number;
  maxAgents: number;
  maxBrowserPages: number;
}

export interface AgentsConfig {
  enabled: boolean;
  maxConcurrent: number;
  roles: AgentRole[];
  customAgents: CustomAgentConfig[];
}

export interface CustomAgentConfig {
  name: string;
  role: AgentRole;
  description: string;
  systemPrompt: string;
  tools: string[];
  model?: string;
}

// ─── File Change Types ───

export interface FileChange {
  path: string;
  type: 'create' | 'modify' | 'delete' | 'rename';
  originalContent?: string;
  newContent?: string;
  diff?: string;
}

// ─── Conversation Types ───

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  metadata: ConversationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMetadata {
  title?: string;
  project?: string;
  tokensUsed: number;
  toolCalls: number;
  agentCalls: number;
  summary?: string;
  tags?: string[];
}

// ─── Permission Types ───

export interface PermissionRequest {
  action: string;
  details: Record<string, unknown>;
  timeout?: number;
}

export interface PermissionResponse {
  granted: boolean;
  permanent: boolean;
  reason?: string;
}

export interface PermissionManager {
  ask(request: PermissionRequest): Promise<PermissionResponse>;
  check(action: string, details: Record<string, unknown>): Promise<boolean>;
  addAutoApprove(pattern: string): void;
  addAutoDeny(pattern: string): void;
  clearCache(): void;
}

// ─── UI Types ───

export interface UIComponent {
  render(): ReactElement;
}

export interface TerminalSize {
  columns: number;
  rows: number;
}

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    muted: string;
    background: string;
    foreground: string;
  };
}

// ─── Logger Types ───

export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
  fatal(message: string, data?: unknown): void;
  logRequest(method: string, url: string, duration: number, status: number): void;
  logToolCall(tool: string, params: unknown, duration: number, success: boolean): void;
  logAIResponse(prompt: string, response: string, tokens: number): void;
  logAgentCall(agent: string, task: string, duration: number, success: boolean): void;
  logSwarmEvent(swarm: string, event: string, data?: unknown): void;
}

// ─── Git Types ───

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  conflicted: string[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: number;
}

// ─── Memory Types ───

export interface MemoryEntry {
  id: string;
  type: 'conversation' | 'tool' | 'error' | 'decision' | 'fact' | 'agent' | 'swarm';
  content: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  importance: number;
}

export interface MemoryIndex {
  entries: MemoryEntry[];
  search(query: string, limit?: number): MemoryEntry[];
  add(entry: MemoryEntry): void;
  compact(): Promise<void>;
  export(format: 'json' | 'md'): string;
}

// ─── Streaming Types ───

export interface StreamChunk {
  type: 'token' | 'tool_call' | 'tool_result' | 'error' | 'done';
  content: string;
  data?: unknown;
}

export type StreamHandler = (chunk: StreamChunk) => void;

// ─── API Types ───

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
  retryable: boolean;
}

// ─── Debug Trail Types ───

export interface TrailStep {
  id: string;
  type: 'tool_call' | 'agent_call' | 'llm_request' | 'file_access' | 'error' | 'decision';
  timestamp: Date;
  description: string;
  input?: unknown;
  output?: unknown;
  duration: number;
  success: boolean;
  parentId?: string;
  [key: string]: unknown;
}

export interface DebugTrail {
  id: string;
  steps: TrailStep[];
  status: 'running' | 'paused' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
}

// ─── Export convenience types ───

// ─── Service Interfaces ───

export interface ToolRegistry {
  register(tool: ToolDefinition): void;
  unregister(name: string): void;
  get(name: string): ToolDefinition | undefined;
  list(): ToolDefinition[];
  listByCategory(category: string): ToolDefinition[];
  execute(name: string, params: Record<string, unknown>): Promise<ToolResult>;
  loadDefaults(): Promise<void>;
  getCount(): number;
  setContext(context: ToolContext): void;
}

export interface AgentOrchestrator {
  getAgents(): Agent[];
  getAgent(id: string): Agent | undefined;
  executeAgent(id: string, task: AgentTask): Promise<AgentResult>;
  executeSwarm(objective: string, context?: string): Promise<AgentResult>;
  initializeSwarm(swarmConfig: { enabled: boolean; maxConcurrent: number; strategy: string; timeout: number; retryAttempts: number }): void;
}

export interface ConversationMemory {
  addMessage(role: ChatMessage['role'], content: string): Promise<void>;
  getMessages(limit?: number): Promise<ChatMessage[]>;
  getTokenCount(): number;
  compact(): Promise<void>;
  addEntry(entry: MemoryEntry): Promise<void>;
  search(query: string, limit?: number): MemoryEntry[];
  load(): Promise<void>;
}

export interface MCPManager {
  connectAll(): Promise<void>;
  listServers(): Promise<void>;
  addServer(name: string, url: string): Promise<void>;
  removeServer(name: string): Promise<void>;
}

export interface LLMProviderFactory {
  getPrimary(): LLMProvider;
  get(type: LLMProviderType): LLMProvider | undefined;
  getAll(): LLMProvider[];
  checkAvailability(): Promise<{ type: LLMProviderType; available: boolean }[]>;
  chat(messages: ChatMessage[], options?: LLMOptions): Promise<string>;
  stream(messages: ChatMessage[], onToken: (token: string) => void, options?: LLMOptions): Promise<string>;
  countTokens(text: string): number;
}

export interface FileIndex {
  build(rootDir: string, options: ContextConfig): Promise<void>;
  getContent(filePath: string): Promise<string | null>;
  getStats(): { totalFiles: number };
}

// Re-export from sub-modules (create these files if needed)
// export * from './tools';
// export * from './agents';
// export * from './mcp';
