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
import { Agent, AgentOrchestrator as IAgentOrchestrator, AgentTask, AgentResult, AgentsConfig, LLMProvider, Logger, ToolRegistry } from '@codex-types/index';
interface ChainedTask {
    task: AgentTask;
    agentId: string;
    usePreviousOutput?: boolean;
}
export declare class AgentOrchestrator implements IAgentOrchestrator {
    private agents;
    private config;
    private logger;
    private llm;
    private tools;
    private swarmEngine?;
    private decomposer?;
    private executionHistory;
    constructor(config: AgentsConfig, llm: LLMProvider, logger: Logger, tools: ToolRegistry);
    /**
     * Initialize swarm components if enabled
     */
    initializeSwarm(swarmConfig: {
        enabled: boolean;
        maxConcurrent: number;
        strategy: string;
        timeout: number;
        retryAttempts: number;
    }): void;
    /**
     * Initialize all 14 default agents with CodexHaven branding
     */
    private initializeDefaultAgents;
    /**
     * Create an executor function for an agent
     */
    private createAgentExecutor;
    /**
     * Execute agents in a chain - output of one feeds into the next
     */
    executeChain(tasks: ChainedTask[]): Promise<AgentResult[]>;
    /**
     * Execute using swarm for complex tasks
     */
    executeSwarm(objective: string, context?: string): Promise<AgentResult>;
    getAgents(): Agent[];
    getAgent(id: string): Agent | undefined;
    executeAgent(id: string, task: AgentTask): Promise<AgentResult>;
    getExecutionHistory(): typeof this.executionHistory;
    clearHistory(): void;
}
export default AgentOrchestrator;
//# sourceMappingURL=orchestrator.d.ts.map