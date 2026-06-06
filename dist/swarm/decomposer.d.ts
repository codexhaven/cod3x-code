/**
 * ═══════════════════════════════════════════════════════════════
 * Task Decomposer - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Intelligently decomposes complex tasks into subtasks
 * for swarm execution with dependency analysis
 * ═══════════════════════════════════════════════════════════════
 */
import { TaskGraph, Logger, LLMProvider } from '@codex-types/index';
export declare class TaskDecomposer {
    private logger;
    private llm;
    constructor(llm: LLMProvider, logger: Logger);
    /**
     * Decompose a complex objective into subtasks
     */
    decompose(objective: string, context?: string): Promise<TaskGraph>;
    /**
     * Parse LLM decomposition response
     */
    private parseDecomposition;
    /**
     * Heuristic decomposition when LLM is unavailable
     */
    private heuristicDecompose;
    /**
     * Optimize task graph for parallel execution
     */
    optimize(graph: TaskGraph): TaskGraph;
    /**
     * Get all ancestor nodes
     */
    private getAncestors;
    /**
     * Estimate execution time for a task graph
     */
    estimateTime(graph: TaskGraph): number;
    /**
     * Estimate token usage for a task graph
     */
    estimateTokens(graph: TaskGraph): number;
    /**
     * Find groups of tasks that can run in parallel
     */
    private findParallelGroups;
}
export default TaskDecomposer;
//# sourceMappingURL=decomposer.d.ts.map