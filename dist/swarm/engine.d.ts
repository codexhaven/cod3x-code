/**
 * ═══════════════════════════════════════════════════════════════
 * Swarm Engine - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Multi-agent swarm execution with task decomposition,
 * parallel execution, and dependency management
 * ═══════════════════════════════════════════════════════════════
 */
import { Swarm, SwarmConfig, SwarmTask, SwarmResult, SwarmStatus, Agent, AgentTask, Logger } from '@codex-types/index';
export declare class SwarmEngine implements Swarm {
    id: string;
    config: SwarmConfig;
    agents: Agent[];
    tasks: SwarmTask[];
    status: SwarmStatus;
    private logger;
    private startTime;
    constructor(config: SwarmConfig, logger: Logger, id?: string);
    /**
     * Register agents for this swarm
     */
    registerAgents(agents: Agent[]): void;
    /**
     * Execute a batch of tasks using the swarm
     */
    execute(tasks: AgentTask[]): Promise<SwarmResult>;
    /**
     * Select the best agent for a task
     */
    private selectAgent;
    /**
     * Execute tasks sequentially
     */
    private executeSequential;
    /**
     * Execute tasks in parallel with concurrency limit
     */
    private executeParallel;
    /**
     * Execute tasks by priority
     */
    private executePriority;
    /**
     * Execute tasks respecting dependencies
     */
    private executeDependency;
    /**
     * Execute tasks in round-robin fashion
     */
    private executeRoundRobin;
    /**
     * Execute a single swarm task
     */
    private executeTask;
    /**
     * Generate execution summary
     */
    private generateSummary;
    private delay;
}
export default SwarmEngine;
//# sourceMappingURL=engine.d.ts.map