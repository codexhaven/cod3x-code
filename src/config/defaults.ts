/**
 * ═══════════════════════════════════════════════════════════════
 * Default Configuration - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * Platform-aware defaults with Termux as primary target
 * ═══════════════════════════════════════════════════════════════
 */

import { Config } from '@codex-types/index';

export const defaultConfig: Config = {
  name: 'cod3x-project',
  version: '1.0.0',

  platform: {
    type: 'termux',
    autoDetect: true,
    shell: 'bash',
    maxConcurrency: 4,
    adaptForMobile: true,
  },

  permissions: {
    askBeforeBash: true,
    askBeforeWrite: true,
    askBeforeDelete: true,
    askBeforeNetwork: false,
    autoApprovePatterns: [
      '^ls ',
      '^pwd$',
      '^echo ',
      '^cat ',
      '^git status$',
      '^git log ',
      '^git diff$',
      '^git branch$',
      '^npm list$',
      '^node --version$',
      '^python --version$',
      '^python3 --version$',
      '^which ',
      '^find ',
      '^grep ',
      '^head ',
      '^tail ',
      '^wc ',
      '^curl -I ',
      '^ping -c 1 ',
    ],
    autoDenyPatterns: [
      'rm\\s+(-rf?|--recursive)\\s+[/\\~]',
      'sudo\\s+',
      'chmod\\s+777\\s+',
      'dd\\s+if=',
      'mkfs',
      '>(\\s)*/dev/sd',
      ':\\(\\)\\s*\\{\\s*:\\|:\\&\\s*\\};:',
      'curl\\s+.*\\|\\s*bash',
      'wget\\s+.*\\|\\s*bash',
      'eval\\s*\\(',
      'netsh\\s+',
      'reg\\s+delete',
      'format\\s+[a-zA-Z]:',
      'del\\s+/[fq]\\s+',
      'rmdir\\s+/[sq]\\s+',
    ],
    blockedCommands: [
      'rm -rf /',
      'sudo',
      'mkfs',
      'dd if=',
      ':(){ :|:& };:',
      'del /f /s /q',
      'format',
      'REG DELETE',
      'netsh',
    ],
    allowedPaths: [process.cwd()],
  },

  context: {
    maxFiles: 200,
    includePatterns: [
      '**/*.{js,ts,jsx,tsx,py,go,rs,java,kt,md,json,yaml,yml}',
      '**/*.{css,scss,html,xml,svg}',
      '**/package.json',
      '**/requirements.txt',
      '**/go.mod',
      '**/Cargo.toml',
      '**/pyproject.toml',
      '**/Dockerfile',
      '**/.github/**/*.yml',
      '**/*.sh',
      '**/*.ps1',
      '**/*.bat',
    ],
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '__pycache__/**',
      'target/**',
      '*.log',
      '.env',
      'coverage/**',
      '.next/**',
      '.nuxt/**',
      'out/**',
      '.cod3x/**',
      'logs/**',
      '*.tmp',
      '*.temp',
    ],
    gitEnabled: true,
    followSymlinks: false,
    indexContent: true,
    respectGitignore: true,
  },

  ai: {
    provider: 'opencode-proxy',
    model: 'claude-sonnet-4',
    temperature: 0.7,
    maxTokens: 8192,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
    systemPrompt: '', // Set dynamically by LLMProviderFactory
    fallbackProvider: 'openrouter',
    fallbackModel: 'deepseek-v4-flash-free',
    opencodeProxyURL: 'http://localhost:6446/v1',
  },

  browser: {
    enabled: true,
    headless: true,
    defaultTimeout: 30000,
  },

  debug: {
    enabled: true,
    trailEnabled: true,
    autoBreakpoints: false,
    logLevel: 'info',
    captureStackTrace: true,
  },

  mcp: {
    enabled: true,
    port: 8765,
    host: 'localhost',
    autoStart: false,
    servers: [],
  },

  hooks: {
    preTool: true,
    postTool: true,
    onError: true,
    customHooksPath: './.cod3x/hooks',
  },

  ide: {
    enabled: true,
    vscode: true,
    autoOpenFiles: true,
    inlineSuggestions: true,
    syncSettings: true,
  },

  ui: {
    theme: 'codexhaven',
    showLineNumbers: true,
    syntaxHighlight: true,
    compactMode: false,
    streaming: true,
    colors: {
      user: 'cyan',
      assistant: 'magenta',
      system: 'gray',
      error: 'red',
      success: 'green',
      warning: 'yellow',
      info: 'blue',
      muted: 'dim',
      codexhaven: '#00D4AA',
      primary: '#00D4AA',
      secondary: '#6366F1',
    },
  },

  logging: {
    level: 'info',
    file: './logs/cod3x.log',
    maxSize: '10MB',
    maxFiles: 10,
    console: true,
    jsonFormat: false,
  },

  features: {
    autoCompact: true,
    suggestImprovements: true,
    trackUsage: false,
    telemetry: false,
    autoSave: true,
    autoComplete: true,
    gitWorkflow: true,
    fileWatching: true,
    multiAgent: true,
    streaming: true,
    swarmAgents: true,
    browser: true,
    debugTrail: true,
  },

  limits: {
    maxFileSize: 10485760,
    maxOutputSize: 50000,
    maxSearchResults: 200,
    maxConversationAge: 86400000,
    maxTokenUsage: 10000000,
    maxToolCalls: 50,
    maxAgents: 10,
    maxBrowserPages: 5,
  },

  agents: {
    enabled: true,
    maxConcurrent: 5,
    roles: [
      'code-generator',
      'code-reviewer',
      'debugger',
      'architect',
      'tester',
      'documenter',
      'git-manager',
      'security-auditor',
      'optimizer',
      'browser',
      'swarm-leader',
      'task-decomposer',
      'error-analyst',
      'trail-runner',
    ],
    customAgents: [],
  },

  swarm: {
    enabled: true,
    maxConcurrent: 5,
    strategy: 'parallel',
    timeout: 300000,
    retryAttempts: 3,
  },
};

export default defaultConfig;
