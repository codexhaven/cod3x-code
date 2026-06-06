/**
 * ═══════════════════════════════════════════════════════════════
 * Swarm Engine - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Multi-agent swarm execution with task decomposition,
 * parallel execution, and dependency management
 * ═══════════════════════════════════════════════════════════════
 */
export class SwarmEngine {
    id;
    config;
    agents = [];
    tasks = [];
    status = 'idle';
    logger;
    startTime = 0;
    constructor(config, logger, id) {
        this.id = id || `swarm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        this.config = config;
        this.logger = logger;
    }
    /**
     * Register agents for this swarm
     */
    registerAgents(agents) {
        this.agents = agents;
        this.logger.info(`Swarm ${this.id}: Registered ${agents.length} agents`);
    }
    /**
     * Execute a batch of tasks using the swarm
     */
    async execute(tasks) {
        this.startTime = Date.now();
        this.status = 'running';
        this.logger.info(`Swarm ${this.id}: Starting execution of ${tasks.length} tasks`);
        // Create swarm tasks
        this.tasks = tasks.map((task, idx) => ({
            id: `task-${idx}-${Date.now()}`,
            task,
            agent: this.selectAgent(task),
            status: 'pending',
            dependencies: task.dependencies || [],
        }));
        try {
            switch (this.config.strategy) {
                case 'sequential':
                    await this.executeSequential();
                    break;
                case 'parallel':
                    await this.executeParallel();
                    break;
                case 'priority':
                    await this.executePriority();
                    break;
                case 'dependency':
                    await this.executeDependency();
                    break;
                case 'round-robin':
                    await this.executeRoundRobin();
                    break;
                default:
                    await this.executeParallel();
            }
            const success = this.tasks.every(t => t.status === 'completed');
            this.status = success ? 'completed' : 'failed';
            const result = {
                success,
                tasks: this.tasks,
                summary: this.generateSummary(),
                duration: Date.now() - this.startTime,
                tokensUsed: this.tasks.reduce((sum, t) => sum + (t.result?.tokensUsed || 0), 0),
            };
            this.logger.info(`Swarm ${this.id}: Execution ${success ? 'completed' : 'failed'} in ${result.duration}ms`);
            return result;
        }
        catch (error) {
            this.status = 'failed';
            this.logger.error(`Swarm ${this.id}: Execution failed`, error);
            return {
                success: false,
                tasks: this.tasks,
                summary: `Failed: ${error.message}`,
                duration: Date.now() - this.startTime,
                tokensUsed: 0,
            };
        }
    }
    /**
     * Select the best agent for a task
     */
    selectAgent(task) {
        // Match agent to task based on role
        const roleMap = {
            'code': ['code-generator', 'optimizer'],
            'review': ['code-reviewer'],
            'debug': ['debugger', 'error-analyst'],
            'test': ['tester'],
            'doc': ['documenter'],
            'git': ['git-manager'],
            'security': ['security-auditor'],
            'architect': ['architect'],
        };
        const keywords = Object.keys(roleMap).filter(k => task.description.toLowerCase().includes(k));
        for (const kw of keywords) {
            for (const role of roleMap[kw]) {
                const agent = this.agents.find(a => a.role === role);
                if (agent)
                    return agent.id;
            }
        }
        // Default to first available agent
        return this.agents[0]?.id || 'default';
    }
    /**
     * Execute tasks sequentially
     */
    async executeSequential() {
        for (const task of this.tasks) {
            await this.executeTask(task);
        }
    }
    /**
     * Execute tasks in parallel with concurrency limit
     */
    async executeParallel() {
        const queue = [...this.tasks];
        const running = [];
        while (queue.length > 0 || running.length > 0) {
            while (running.length < this.config.maxConcurrent && queue.length > 0) {
                const task = queue.shift();
                const promise = this.executeTask(task).then(() => {
                    const idx = running.indexOf(promise);
                    if (idx > -1)
                        running.splice(idx, 1);
                });
                running.push(promise);
            }
            if (running.length > 0) {
                await Promise.race(running);
            }
        }
    }
    /**
     * Execute tasks by priority
     */
    async executePriority() {
        const priorityOrder = {
            critical: 0,
            high: 1,
            medium: 2,
            low: 3,
        };
        this.tasks.sort((a, b) => {
            const pa = priorityOrder[a.task.priority || 'medium'];
            const pb = priorityOrder[b.task.priority || 'medium'];
            return pa - pb;
        });
        await this.executeParallel();
    }
    /**
     * Execute tasks respecting dependencies
     */
    async executeDependency() {
        const completed = new Set();
        const pending = new Set(this.tasks.map(t => t.id));
        while (pending.size > 0) {
            const ready = this.tasks.filter(t => pending.has(t.id) &&
                t.dependencies.every(dep => completed.has(dep)));
            if (ready.length === 0 && pending.size > 0) {
                throw new Error('Circular dependency detected in swarm tasks');
            }
            await Promise.all(ready.map(t => this.executeTask(t).then(() => {
                completed.add(t.id);
                pending.delete(t.id);
            })));
        }
    }
    /**
     * Execute tasks in round-robin fashion
     */
    async executeRoundRobin() {
        const agentQueue = [...this.agents];
        for (const task of this.tasks) {
            const agent = agentQueue.shift();
            task.agent = agent.id;
            agentQueue.push(agent);
            await this.executeTask(task);
        }
    }
    /**
     * Execute a single swarm task
     */
    async executeTask(swarmTask) {
        swarmTask.status = 'running';
        swarmTask.startedAt = new Date();
        this.logger.info(`Swarm ${this.id}: Executing task ${swarmTask.id}`);
        const agent = this.agents.find(a => a.id === swarmTask.agent);
        if (!agent) {
            swarmTask.status = 'failed';
            swarmTask.result = { success: false, output: '', summary: `Agent ${swarmTask.agent} not found` };
            return;
        }
        for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const result = await agent.execute(swarmTask.task);
                swarmTask.result = result;
                swarmTask.status = result.success ? 'completed' : 'failed';
                swarmTask.completedAt = new Date();
                this.logger.info(`Swarm ${this.id}: Task ${swarmTask.id} ${swarmTask.status}`);
                return;
            }
            catch (error) {
                this.logger.warn(`Swarm ${this.id}: Task ${swarmTask.id} attempt ${attempt + 1} failed`);
                if (attempt < this.config.retryAttempts) {
                    swarmTask.status = 'retrying';
                    await this.delay(1000 * (attempt + 1));
                }
                else {
                    swarmTask.status = 'failed';
                    swarmTask.result = {
                        success: false,
                        output: '',
                        summary: `Failed after ${this.config.retryAttempts + 1} attempts: ${error.message}`,
                    };
                }
            }
        }
    }
    /**
     * Generate execution summary
     */
    generateSummary() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const failed = this.tasks.filter(t => t.status === 'failed').length;
        const duration = Date.now() - this.startTime;
        return `Swarm Execution Summary:
- Total tasks: ${total}
- Completed: ${completed}
- Failed: ${failed}
- Duration: ${(duration / 1000).toFixed(1)}s
- Agents used: ${new Set(this.tasks.map(t => t.agent)).size}`;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
export default SwarmEngine;
//# sourceMappingURL=engine.js.map