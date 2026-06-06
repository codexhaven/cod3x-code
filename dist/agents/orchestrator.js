/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Agent Orchestrator - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Multi-agent orchestration with swarm support, task decomposition,
 * agent chaining, and 14 specialized agents for comprehensive
 * code assistance
 * ═══════════════════════════════════════════════════════════════
 */
import { SwarmEngine } from '../swarm/engine.js';
import { TaskDecomposer } from '../swarm/decomposer.js';
export class AgentOrchestrator {
    agents = new Map();
    config;
    logger;
    llm;
    tools;
    swarmEngine;
    decomposer;
    executionHistory = [];
    constructor(config, llm, logger, tools) {
        this.config = config;
        this.llm = llm;
        this.logger = logger;
        this.tools = tools;
        this.initializeDefaultAgents();
    }
    /**
     * Initialize swarm components if enabled
     */
    initializeSwarm(swarmConfig) {
        if (!swarmConfig.enabled)
            return;
        this.swarmEngine = new SwarmEngine({
            enabled: true,
            maxConcurrent: swarmConfig.maxConcurrent,
            strategy: swarmConfig.strategy,
            timeout: swarmConfig.timeout,
            retryAttempts: swarmConfig.retryAttempts,
        }, this.logger);
        this.decomposer = new TaskDecomposer(this.llm, this.logger);
        this.logger.info('Swarm engine initialized');
    }
    /**
     * Initialize all 14 default agents with CodexHaven branding
     */
    initializeDefaultAgents() {
        const defaultAgents = [
            {
                id: 'code-gen',
                name: 'Code Generator',
                description: 'Generate production-ready code from specifications',
                role: 'code-generator',
                systemPrompt: `You are an expert code generator for Cod3x by CodexHaven. You write clean, efficient, well-documented code. Always consider edge cases, error handling, and best practices. Follow the existing code style of the project. When generating code:
1. Provide complete, working implementations
2. Include error handling and input validation
3. Add JSDoc comments for functions
4. Use modern language features
5. Consider performance implications`,
                tools: ['write_file', 'read_file', 'edit_file', 'bash', 'write_json'],
                execute: this.createAgentExecutor('code-generator'),
            },
            {
                id: 'code-review',
                name: 'Code Reviewer',
                description: 'Review code for quality, security, and best practices',
                role: 'code-reviewer',
                systemPrompt: `You are a senior code reviewer for Cod3x by CodexHaven. You analyze code for correctness, performance, security vulnerabilities, maintainability, and adherence to best practices. Provide specific, actionable feedback with line numbers where possible. Rate each issue as: critical, warning, or suggestion.`,
                tools: ['read_file', 'analyze_code', 'lint_code', 'grep_search'],
                execute: this.createAgentExecutor('code-reviewer'),
            },
            {
                id: 'debugger',
                name: 'Debugger',
                description: 'Debug errors and fix issues with root cause analysis',
                role: 'debugger',
                systemPrompt: `You are an expert debugger for Cod3x by CodexHaven. You trace through code execution, identify root causes of bugs, and implement minimal, correct fixes. Always explain:
1. Why the bug occurred (root cause)
2. How your fix resolves it
3. How to prevent similar issues in the future`,
                tools: ['read_file', 'bash', 'grep_search', 'git_log', 'eval_code'],
                execute: this.createAgentExecutor('debugger'),
            },
            {
                id: 'architect',
                name: 'Architect',
                description: 'Design system architecture and patterns',
                role: 'architect',
                systemPrompt: `You are a software architect for Cod3x by CodexHaven. You design scalable, maintainable systems. Consider trade-offs between complexity, performance, and maintainability. Document your architectural decisions with rationale.`,
                tools: ['read_file', 'write_file', 'analyze_code', 'write_json'],
                execute: this.createAgentExecutor('architect'),
            },
            {
                id: 'tester',
                name: 'Tester',
                description: 'Generate comprehensive tests and verify coverage',
                role: 'tester',
                systemPrompt: `You are a QA engineer for Cod3x by CodexHaven. You write thorough tests covering happy paths, edge cases, and error conditions. Aim for high coverage without brittle tests. Include:
1. Unit tests for individual functions
2. Integration tests for component interactions
3. Edge case and boundary tests
4. Error handling verification`,
                tools: ['generate_tests', 'run_tests', 'coverage_report', 'read_file', 'write_file'],
                execute: this.createAgentExecutor('tester'),
            },
            {
                id: 'documenter',
                name: 'Documenter',
                description: 'Generate comprehensive documentation',
                role: 'documenter',
                systemPrompt: `You are a technical writer for Cod3x by CodexHaven. You create clear, comprehensive documentation including READMEs, API docs, and inline comments. Make complex concepts accessible. Follow documentation best practices.`,
                tools: ['generate_docs', 'readme_generator', 'read_file', 'write_file'],
                execute: this.createAgentExecutor('documenter'),
            },
            {
                id: 'git-manager',
                name: 'Git Manager',
                description: 'Manage git workflows and version control',
                role: 'git-manager',
                systemPrompt: `You are a Git expert for Cod3x by CodexHaven. You manage branches, commits, merges, and releases following best practices. Write clear commit messages and handle conflicts gracefully. Prefer rebase for clean history.`,
                tools: ['git_status', 'git_commit', 'git_branch', 'git_diff', 'git_log', 'git_checkout', 'git_stash', 'git_merge', 'git_remote'],
                execute: this.createAgentExecutor('git-manager'),
            },
            {
                id: 'security',
                name: 'Security Auditor',
                description: 'Audit code for security vulnerabilities',
                role: 'security-auditor',
                systemPrompt: `You are a security expert for Cod3x by CodexHaven. You identify vulnerabilities including injection flaws, insecure dependencies, authentication issues, and data exposure. Provide severity ratings (critical/high/medium/low) and specific remediation steps.`,
                tools: ['analyze_code', 'grep_search', 'read_file', 'read_json'],
                execute: this.createAgentExecutor('security-auditor'),
            },
            {
                id: 'optimizer',
                name: 'Optimizer',
                description: 'Optimize code performance and resource usage',
                role: 'optimizer',
                systemPrompt: `You are a performance engineer for Cod3x by CodexHaven. You identify bottlenecks, reduce complexity, and optimize resource usage. Measure before and after to demonstrate improvements. Focus on algorithmic efficiency and memory usage.`,
                tools: ['analyze_code', 'refactor_code', 'read_file', 'bash'],
                execute: this.createAgentExecutor('optimizer'),
            },
            {
                id: 'browser',
                name: 'Web Browser',
                description: 'Browse web pages and extract information',
                role: 'browser',
                systemPrompt: `You are a web research agent for Cod3x by CodexHaven. You browse websites, extract relevant information, and summarize findings. Respect robots.txt and terms of service. Provide concise summaries with source URLs.`,
                tools: ['fetch_url', 'web_search', 'download_file', 'browse_page'],
                execute: this.createAgentExecutor('browser'),
            },
            {
                id: 'swarm-leader',
                name: 'Swarm Leader',
                description: 'Coordinate multi-agent swarm execution',
                role: 'swarm-leader',
                systemPrompt: `You are a swarm coordinator for Cod3x by CodexHaven. You break down complex tasks, delegate to specialized agents, and synthesize their results into coherent outputs. Track progress and handle failures gracefully.`,
                tools: ['read_file', 'write_file', 'bash', 'analyze_code'],
                execute: this.createAgentExecutor('swarm-leader'),
            },
            {
                id: 'task-decomposer',
                name: 'Task Decomposer',
                description: 'Break down complex tasks into subtasks',
                role: 'task-decomposer',
                systemPrompt: `You are a task decomposition specialist for Cod3x by CodexHaven. You analyze complex requirements and break them into manageable, independent subtasks with clear dependencies. Ensure each subtask is specific and actionable.`,
                tools: ['read_file', 'analyze_code', 'write_json'],
                execute: this.createAgentExecutor('task-decomposer'),
            },
            {
                id: 'error-analyst',
                name: 'Error Analyst',
                description: 'Analyze errors and provide detailed diagnostics',
                role: 'error-analyst',
                systemPrompt: `You are an error analysis expert for Cod3x by CodexHaven. You parse stack traces, identify root causes, and provide step-by-step remediation guidance. Include relevant documentation links when possible.`,
                tools: ['read_file', 'bash', 'grep_search', 'git_log'],
                execute: this.createAgentExecutor('error-analyst'),
            },
            {
                id: 'trail-runner',
                name: 'Trail Runner',
                description: 'Execute and trace code with detailed logging',
                role: 'trail-runner',
                systemPrompt: `You are an execution tracing specialist for Cod3x by CodexHaven. You run code step by step, logging each operation and its result for debugging and auditing purposes. Create detailed execution reports.`,
                tools: ['bash', 'eval_code', 'read_file', 'trail_start', 'trail_stop'],
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
    createAgentExecutor(role) {
        return async (task) => {
            const startTime = Date.now();
            this.logger.info(`Agent ${role} executing: ${task.description.slice(0, 80)}`);
            try {
                // Get available tools for this agent
                const agent = this.agents.get(role) || this.agents.get('code-gen');
                const agentTools = agent?.tools || [];
                const toolList = this.tools.list()
                    .filter(t => agentTools.length === 0 || agentTools.includes(t.name))
                    .map(t => `${t.name}: ${t.description}`).join('\n');
                const prompt = `You are a ${role} agent for Cod3x by CodexHaven.
Task: ${task.description}
${task.context ? `Context: ${task.context}` : ''}
${task.files ? `Files: ${task.files.join(', ')}` : ''}

Available tools:
${toolList}

Execute this task using the appropriate tools. Provide a complete solution.
When using tools, format: <cod3x-tool>tool_name</cod3x-tool> followed by <cod3x-params>{"param": "value"}</cod3x-params>

After all tool calls, provide a final comprehensive answer.`;
                const response = await this.llm.chat([
                    { role: 'system', content: agent?.systemPrompt || `You are a ${role}` },
                    { role: 'user', content: prompt },
                ]);
                // Parse tool calls from response and execute them
                let enhancedOutput = response;
                const toolCallRegex = /<cod3x-tool>(.*?)<\/cod3x-tool>\s*<cod3x-params>(.*?)<\/cod3x-params>/gs;
                let toolMatch;
                const toolResults = [];
                while ((toolMatch = toolCallRegex.exec(response)) !== null) {
                    const toolName = toolMatch[1].trim();
                    try {
                        const toolParams = JSON.parse(toolMatch[2].trim());
                        this.logger.info(`Agent executing tool: ${toolName}`, toolParams);
                        const result = await this.tools.execute(toolName, toolParams);
                        toolResults.push(`Tool ${toolName}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.output?.slice(0, 500) || result.error?.slice(0, 500)}`);
                    }
                    catch (e) {
                        toolResults.push(`Tool ${toolName}: ERROR - ${e.message}`);
                    }
                }
                if (toolResults.length > 0) {
                    enhancedOutput = response.replace(toolCallRegex, '') + '\n\n[Tool Results]\n' + toolResults.join('\n');
                }
                const result = {
                    success: true,
                    output: enhancedOutput,
                    summary: `Agent ${role} completed task: ${task.description.slice(0, 100)}`,
                    tokensUsed: this.llm.countTokens(prompt + response),
                    duration: Date.now() - startTime,
                };
                this.executionHistory.push({ timestamp: Date.now(), agent: role, task: task.description, result });
                return result;
            }
            catch (error) {
                this.logger.error(`Agent ${role} failed`, error);
                return {
                    success: false,
                    output: '',
                    summary: `Agent ${role} failed: ${error.message}`,
                    duration: Date.now() - startTime,
                };
            }
        };
    }
    /**
     * Execute agents in a chain - output of one feeds into the next
     */
    async executeChain(tasks) {
        this.logger.info(`Executing agent chain with ${tasks.length} tasks`);
        const results = [];
        let previousOutput = '';
        for (let i = 0; i < tasks.length; i++) {
            const { task, agentId, usePreviousOutput } = tasks[i];
            if (usePreviousOutput && previousOutput) {
                task.context = `${task.context || ''}\n\nPrevious step output:\n${previousOutput.slice(0, 3000)}`;
            }
            this.logger.info(`Chain step ${i + 1}/${tasks.length}: ${agentId}`);
            const result = await this.executeAgent(agentId, task);
            results.push(result);
            if (result.success) {
                previousOutput = result.output;
            }
            else {
                this.logger.warn(`Chain step ${i + 1} failed, continuing with empty context`);
                previousOutput = '';
            }
        }
        this.logger.info(`Agent chain complete: ${results.filter(r => r.success).length}/${tasks.length} succeeded`);
        return results;
    }
    /**
     * Execute using swarm for complex tasks
     */
    async executeSwarm(objective, context) {
        const startTime = Date.now();
        if (!this.swarmEngine || !this.decomposer) {
            // Fallback to single agent execution
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
            .map(t => `### ${t.task.description}\n${t.result.output}`)
            .join('\n\n---\n\n');
        const failed = result.tasks.filter(t => !t.result?.success);
        const summary = `Swarm completed ${result.tasks.filter(t => t.result?.success).length}/${result.tasks.length} tasks in ${result.duration}ms.${failed.length > 0 ? `\nFailed tasks: ${failed.map(f => f.task.description).join(', ')}` : ''}`;
        return {
            success: result.success,
            output: outputs,
            summary,
            duration: Date.now() - startTime,
            tokensUsed: result.tokensUsed,
        };
    }
    getAgents() {
        return Array.from(this.agents.values());
    }
    getAgent(id) {
        return this.agents.get(id);
    }
    async executeAgent(id, task) {
        const agent = this.agents.get(id);
        if (!agent)
            throw new Error(`Agent not found: ${id}`);
        return agent.execute(task);
    }
    getExecutionHistory() {
        return this.executionHistory;
    }
    clearHistory() {
        this.executionHistory = [];
    }
}
export default AgentOrchestrator;
//# sourceMappingURL=orchestrator.js.map