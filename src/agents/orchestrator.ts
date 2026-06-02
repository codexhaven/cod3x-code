/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Agent Orchestrator - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * Multi-agent orchestration with swarm support, task decomposition,
 * and 14 specialized agents for comprehensive code assistance
 * ═══════════════════════════════════════════════════════════════
 */

import {
  Agent,
  AgentOrchestrator as IAgentOrchestrator,
  AgentTask,
  AgentResult,
  AgentsConfig,
  AgentRole,
  LLMProvider,
  Logger,
  ToolRegistry,
} from '@codex-types/index';
import { SwarmEngine } from '@swarm/engine';
import { TaskDecomposer } from '@swarm/decomposer';

export class AgentOrchestrator implements IAgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private config: AgentsConfig;
  private logger: Logger;
  private llm: LLMProvider;
  private tools: ToolRegistry;
  private swarmEngine?: SwarmEngine;
  private decomposer?: TaskDecomposer;

  constructor(config: AgentsConfig, llm: LLMProvider, logger: Logger, tools: ToolRegistry) {
    this.config = config;
    this.llm = llm;
    this.logger = logger;
    this.tools = tools;
    this.initializeDefaultAgents();
  }

  /**
   * Initialize swarm components if enabled
   */
  initializeSwarm(swarmConfig: { enabled: boolean; maxConcurrent: number; strategy: string; timeout: number; retryAttempts: number }): void {
    if (!swarmConfig.enabled) return;

    this.swarmEngine = new SwarmEngine(
      {
        enabled: true,
        maxConcurrent: swarmConfig.maxConcurrent,
        strategy: swarmConfig.strategy as any,
        timeout: swarmConfig.timeout,
        retryAttempts: swarmConfig.retryAttempts,
      },
      this.logger
    );
    this.decomposer = new TaskDecomposer(this.llm, this.logger);
    this.logger.info('Swarm engine initialized');
  }

  /**
   * Initialize all 14 default agents
   */
  private initializeDefaultAgents(): void {
    const defaultAgents: Agent[] = [
      {
        id: 'code-gen',
        name: 'Code Generator',
        description: 'Generate production-ready code from specifications',
        role: 'code-generator',
        systemPrompt: `You are an expert code generator for Cod3x by CodexHaven. You write clean, efficient, well-documented code. Always consider edge cases, error handling, and best practices. Follow the existing code style of the project.`,
        tools: ['write_file', 'read_file', 'edit_file', 'bash'],
        execute: this.createAgentExecutor('code-generator'),
      },
      {
        id: 'code-review',
        name: 'Code Reviewer',
        description: 'Review code for quality, security, and best practices',
        role: 'code-reviewer',
        systemPrompt: `You are a senior code reviewer for Cod3x by CodexHaven. You analyze code for correctness, performance, security vulnerabilities, maintainability, and adherence to best practices. Provide specific, actionable feedback.`,
        tools: ['read_file', 'analyze_code', 'lint_code'],
        execute: this.createAgentExecutor('code-reviewer'),
      },
      {
        id: 'debugger',
        name: 'Debugger',
        description: 'Debug errors and fix issues with root cause analysis',
        role: 'debugger',
        systemPrompt: `You are an expert debugger for Cod3x by CodexHaven. You trace through code execution, identify root causes of bugs, and implement minimal, correct fixes. Always explain why the bug occurred and how your fix resolves it.`,
        tools: ['read_file', 'bash', 'grep_search', 'git_log'],
        execute: this.createAgentExecutor('debugger'),
      },
      {
        id: 'architect',
        name: 'Architect',
        description: 'Design system architecture and patterns',
        role: 'architect',
        systemPrompt: `You are a software architect for Cod3x by CodexHaven. You design scalable, maintainable systems. Consider trade-offs between complexity, performance, and maintainability. Document your architectural decisions.`,
        tools: ['read_file', 'write_file', 'analyze_code'],
        execute: this.createAgentExecutor('architect'),
      },
      {
        id: 'tester',
        name: 'Tester',
        description: 'Generate comprehensive tests and verify coverage',
        role: 'tester',
        systemPrompt: `You are a QA engineer for Cod3x by CodexHaven. You write thorough tests covering happy paths, edge cases, and error conditions. Aim for high coverage without brittle tests.`,
        tools: ['generate_tests', 'run_tests', 'coverage_report', 'read_file'],
        execute: this.createAgentExecutor('tester'),
      },
      {
        id: 'documenter',
        name: 'Documenter',
        description: 'Generate comprehensive documentation',
        role: 'documenter',
        systemPrompt: `You are a technical writer for Cod3x by CodexHaven. You create clear, comprehensive documentation including READMEs, API docs, and inline comments. Make complex concepts accessible.`,
        tools: ['generate_docs', 'readme_generator', 'read_file', 'write_file'],
        execute: this.createAgentExecutor('documenter'),
      },
      {
        id: 'git-manager',
        name: 'Git Manager',
        description: 'Manage git workflows and version control',
        role: 'git-manager',
        systemPrompt: `You are a Git expert for Cod3x by CodexHaven. You manage branches, commits, merges, and releases following best practices. Write clear commit messages and handle conflicts gracefully.`,
        tools: ['git_status', 'git_commit', 'git_branch', 'git_diff', 'git_log'],
        execute: this.createAgentExecutor('git-manager'),
      },
      {
        id: 'security',
        name: 'Security Auditor',
        description: 'Audit code for security vulnerabilities',
        role: 'security-auditor',
        systemPrompt: `You are a security expert for Cod3x by CodexHaven. You identify vulnerabilities including injection flaws, insecure dependencies, authentication issues, and data exposure. Provide severity ratings and remediation steps.`,
        tools: ['analyze_code', 'grep_search', 'read_file'],
        execute: this.createAgentExecutor('security-auditor'),
      },
      {
        id: 'optimizer',
        name: 'Optimizer',
        description: 'Optimize code performance and resource usage',
        role: 'optimizer',
        systemPrompt: `You are a performance engineer for Cod3x by CodexHaven. You identify bottlenecks, reduce complexity, and optimize resource usage. Measure before and after to demonstrate improvements.`,
        tools: ['analyze_code', 'refactor_code', 'read_file'],
        execute: this.createAgentExecutor('optimizer'),
      },
      {
        id: 'browser',
        name: 'Web Browser',
        description: 'Browse web pages and extract information',
        role: 'browser',
        systemPrompt: `You are a web research agent for Cod3x by CodexHaven. You browse websites, extract relevant information, and summarize findings. Respect robots.txt and terms of service.`,
        tools: ['fetch_url', 'web_search', 'download_file'],
        execute: this.createAgentExecutor('browser'),
      },
      {
        id: 'swarm-leader',
        name: 'Swarm Leader',
        description: 'Coordinate multi-agent swarm execution',
        role: 'swarm-leader',
        systemPrompt: `You are a swarm coordinator for Cod3x by CodexHaven. You break down complex tasks, delegate to specialized agents, and synthesize their results into coherent outputs.`,
        tools: ['read_file', 'write_file', 'bash'],
        execute: this.createAgentExecutor('swarm-leader'),
      },
      {
        id: 'task-decomposer',
        name: 'Task Decomposer',
        description: 'Break down complex tasks into subtasks',
        role: 'task-decomposer',
        systemPrompt: `You are a task decomposition specialist for Cod3x by CodexHaven. You analyze complex requirements and break them into manageable, independent subtasks with clear dependencies.`,
        tools: ['read_file', 'analyze_code'],
        execute: this.createAgentExecutor('task-decomposer'),
      },
      {
        id: 'error-analyst',
        name: 'Error Analyst',
        description: 'Analyze errors and provide detailed diagnostics',
        role: 'error-analyst',
        systemPrompt: `You are an error analysis expert for Cod3x by CodexHaven. You parse stack traces, identify root causes, and provide step-by-step remediation guidance.`,
        tools: ['read_file', 'bash', 'grep_search'],
        execute: this.createAgentExecutor('error-analyst'),
      },
      {
        id: 'trail-runner',
        name: 'Trail Runner',
        description: 'Execute and trace code with detailed logging',
        role: 'trail-runner',
        systemPrompt: `You are an execution tracing specialist for Cod3x by CodexHaven. You run code step by step, logging each operation and its result for debugging and auditing purposes.`,
        tools: ['bash', 'eval_code', 'read_file'],
        execute: this.createAgentExecutor('trail-runner'),
      },
    ];

    for (const agent of defaultAgents) {
      this.agents.set(agent.id, agent);
    }

    this.logger.info(`Initialized ${defaultAgents.length} default agents`);
  }

  /**
   * Create an executor function for an agent
   */
  private createAgentExecutor(role: AgentRole) {
    return async (task: AgentTask): Promise<AgentResult> => {
      const startTime = Date.now();
      this.logger.info(`Agent ${role} executing: ${task.description.slice(0, 80)}`);

      try {
        // Build context from available tools
        const toolList = this.tools.list().map(t => `${t.name}: ${t.description}`).join('\n');
        
        const prompt = `You are a ${role} agent for Cod3x by CodexHaven.
Task: ${task.description}
${task.context ? `Context: ${task.context}` : ''}
${task.files ? `Files: ${task.files.join(', ')}` : ''}

Available tools:
${toolList}

Execute this task using the appropriate tools. Provide a complete solution.`;

        const response = await this.llm.chat([
          { role: 'system', content: this.agents.get(role)?.systemPrompt || `You are a ${role}` },
          { role: 'user', content: prompt },
        ]);

        return {
          success: true,
          output: response,
          summary: `Agent ${role} completed task`,
          tokensUsed: this.llm.countTokens(prompt + response),
          duration: Date.now() - startTime,
        };
      } catch (error) {
        this.logger.error(`Agent ${role} failed`, error);
        return {
          success: false,
          output: '',
          summary: `Agent ${role} failed: ${(error as Error).message}`,
          duration: Date.now() - startTime,
        };
      }
    };
  }

  /**
   * Execute using swarm for complex tasks
   */
  async executeSwarm(objective: string, context?: string): Promise<AgentResult> {
    if (!this.swarmEngine || !this.decomposer) {
      return this.executeAgent('code-gen', { id: 'fallback', description: objective, context });
    }

    this.logger.info('Executing with swarm', { objective: objective.slice(0, 100) });

    // Decompose into subtasks
    const graph = await this.decomposer.decompose(objective, context);
    
    // Register agents with swarm
    this.swarmEngine.registerAgents(Array.from(this.agents.values()));

    // Execute
    const tasks = graph.nodes.map(n => n.task);
    const result = await this.swarmEngine.execute(tasks);

    // Synthesize results
    const outputs = result.tasks
      .filter(t => t.result?.success)
      .map(t => t.result!.output)
      .join('\n\n---\n\n');

    return {
      success: result.success,
      output: outputs,
      summary: result.summary,
      duration: result.duration,
      tokensUsed: result.tokensUsed,
    };
  }

  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  async executeAgent(id: string, task: AgentTask): Promise<AgentResult> {
    const agent = this.agents.get(id);
    if (!agent) throw new Error(`Agent not found: ${id}`);
    return agent.execute(task);
  }
}

export default AgentOrchestrator;
