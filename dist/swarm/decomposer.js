/**
 * ═══════════════════════════════════════════════════════════════
 * Task Decomposer - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Intelligently decomposes complex tasks into subtasks
 * for swarm execution with dependency analysis
 * ═══════════════════════════════════════════════════════════════
 */
export class TaskDecomposer {
    logger;
    llm;
    constructor(llm, logger) {
        this.llm = llm;
        this.logger = logger;
    }
    /**
     * Decompose a complex objective into subtasks
     */
    async decompose(objective, context) {
        this.logger.info('Decomposing objective', { objective: objective.slice(0, 100) });
        // Use LLM to decompose the task
        const prompt = `Decompose the following coding task into specific subtasks that can be executed in parallel where possible.

Objective: ${objective}
${context ? `Context: ${context}` : ''}

Analyze the task and break it down into 2-8 specific subtasks. For each subtask:
1. Provide a clear description
2. Assign a priority (critical, high, medium, low)
3. List any dependencies on other subtasks (by number)
4. Suggest the best agent role for the task

Available agent roles:
- code-generator: Write new code
- code-reviewer: Review existing code
- debugger: Debug and fix errors
- architect: Design system structure
- tester: Write and run tests
- documenter: Create documentation
- security-auditor: Security analysis
- optimizer: Performance optimization

Format your response as:
TASK 1: [description]
PRIORITY: [level]
DEPENDS: [task numbers or none]
AGENT: [role]

TASK 2: ...

Be specific and actionable. Each subtask should be independently executable.`;
        try {
            const response = await this.llm.chat([
                { role: 'system', content: 'You are a task decomposition expert. Break down complex coding tasks into clear, executable subtasks.' },
                { role: 'user', content: prompt },
            ]);
            return this.parseDecomposition(response, objective);
        }
        catch (error) {
            this.logger.warn('LLM decomposition failed, using heuristic', { error: error.message });
            return this.heuristicDecompose(objective);
        }
    }
    /**
     * Parse LLM decomposition response
     */
    parseDecomposition(response, originalObjective) {
        const nodes = [];
        const edges = [];
        const taskMap = new Map();
        const taskRegex = /TASK\s+(\d+):\s*(.+?)(?=TASK\s+\d+|$)/gs;
        const priorityRegex = /PRIORITY:\s*(\w+)/i;
        const dependsRegex = /DEPENDS:\s*([\d,\s]+|none)/i;
        const agentRegex = /AGENT:\s*(\w[\w-]*)/i;
        let match;
        while ((match = taskRegex.exec(response)) !== null) {
            const taskNum = parseInt(match[1]);
            const block = match[0];
            const description = match[2].trim();
            const priority = (block.match(priorityRegex)?.[1] || 'medium').toLowerCase();
            const dependsStr = block.match(dependsRegex)?.[1] || 'none';
            const agent = block.match(agentRegex)?.[1] || 'code-generator';
            const id = `subtask-${taskNum}`;
            taskMap.set(taskNum, id);
            const dependencies = dependsStr.toLowerCase() === 'none'
                ? []
                : dependsStr.split(',').map(s => `subtask-${parseInt(s.trim())}`).filter(Boolean);
            const task = {
                id,
                description,
                priority: ['critical', 'high', 'medium', 'low'].includes(priority) ? priority : 'medium',
                dependencies,
            };
            nodes.push({
                id,
                task,
                status: 'pending',
            });
        }
        // If no tasks were parsed, fall back to heuristic
        if (nodes.length === 0) {
            return this.heuristicDecompose(originalObjective);
        }
        // Build dependency edges
        for (const node of nodes) {
            for (const depId of node.task.dependencies || []) {
                if (nodes.some(n => n.id === depId)) {
                    edges.push({
                        from: depId,
                        to: node.id,
                        type: 'depends_on',
                    });
                }
            }
        }
        // Optimize: parallelize independent tasks
        return this.optimize({ nodes, edges });
    }
    /**
     * Heuristic decomposition when LLM is unavailable
     */
    heuristicDecompose(objective) {
        const nodes = [];
        const edges = [];
        // Simple keyword-based decomposition
        const lower = objective.toLowerCase();
        if (lower.includes('create') || lower.includes('build') || lower.includes('implement')) {
            nodes.push({ id: 'subtask-1', task: { id: 'subtask-1', description: `Analyze requirements: ${objective}`, priority: 'high', dependencies: [] }, status: 'pending' }, { id: 'subtask-2', task: { id: 'subtask-2', description: `Design structure for: ${objective}`, priority: 'high', dependencies: ['subtask-1'] }, status: 'pending' }, { id: 'subtask-3', task: { id: 'subtask-3', description: `Implement core functionality: ${objective}`, priority: 'critical', dependencies: ['subtask-2'] }, status: 'pending' }, { id: 'subtask-4', task: { id: 'subtask-4', description: `Add error handling and validation`, priority: 'medium', dependencies: ['subtask-3'] }, status: 'pending' }, { id: 'subtask-5', task: { id: 'subtask-5', description: `Write tests for: ${objective}`, priority: 'medium', dependencies: ['subtask-3'] }, status: 'pending' });
            edges.push({ from: 'subtask-1', to: 'subtask-2', type: 'depends_on' }, { from: 'subtask-2', to: 'subtask-3', type: 'depends_on' }, { from: 'subtask-3', to: 'subtask-4', type: 'depends_on' }, { from: 'subtask-3', to: 'subtask-5', type: 'depends_on' });
        }
        else if (lower.includes('fix') || lower.includes('debug') || lower.includes('error')) {
            nodes.push({ id: 'subtask-1', task: { id: 'subtask-1', description: `Investigate the issue: ${objective}`, priority: 'critical', dependencies: [] }, status: 'pending' }, { id: 'subtask-2', task: { id: 'subtask-2', description: `Identify root cause`, priority: 'critical', dependencies: ['subtask-1'] }, status: 'pending' }, { id: 'subtask-3', task: { id: 'subtask-3', description: `Implement fix`, priority: 'high', dependencies: ['subtask-2'] }, status: 'pending' }, { id: 'subtask-4', task: { id: 'subtask-4', description: `Verify fix and add regression test`, priority: 'high', dependencies: ['subtask-3'] }, status: 'pending' });
            edges.push({ from: 'subtask-1', to: 'subtask-2', type: 'depends_on' }, { from: 'subtask-2', to: 'subtask-3', type: 'depends_on' }, { from: 'subtask-3', to: 'subtask-4', type: 'depends_on' });
        }
        else if (lower.includes('refactor') || lower.includes('optimize')) {
            nodes.push({ id: 'subtask-1', task: { id: 'subtask-1', description: `Analyze current code: ${objective}`, priority: 'high', dependencies: [] }, status: 'pending' }, { id: 'subtask-2', task: { id: 'subtask-2', description: `Identify improvement areas`, priority: 'high', dependencies: ['subtask-1'] }, status: 'pending' }, { id: 'subtask-3', task: { id: 'subtask-3', description: `Apply refactoring changes`, priority: 'critical', dependencies: ['subtask-2'] }, status: 'pending' }, { id: 'subtask-4', task: { id: 'subtask-4', description: `Run tests to verify`, priority: 'high', dependencies: ['subtask-3'] }, status: 'pending' });
            edges.push({ from: 'subtask-1', to: 'subtask-2', type: 'depends_on' }, { from: 'subtask-2', to: 'subtask-3', type: 'depends_on' }, { from: 'subtask-3', to: 'subtask-4', type: 'depends_on' });
        }
        else {
            // Generic single-task fallback
            nodes.push({ id: 'subtask-1', task: { id: 'subtask-1', description: objective, priority: 'high', dependencies: [] }, status: 'pending' });
        }
        return { nodes, edges };
    }
    /**
     * Optimize task graph for parallel execution
     */
    optimize(graph) {
        // Find tasks that can be parallelized
        const dependencyMap = new Map();
        for (const node of graph.nodes) {
            const deps = new Set(node.task.dependencies || []);
            for (const edge of graph.edges) {
                if (edge.to === node.id && edge.type === 'depends_on') {
                    deps.add(edge.from);
                }
            }
            dependencyMap.set(node.id, deps);
        }
        // Mark parallel relationships
        for (let i = 0; i < graph.nodes.length; i++) {
            for (let j = i + 1; j < graph.nodes.length; j++) {
                const a = graph.nodes[i];
                const b = graph.nodes[j];
                const depsA = dependencyMap.get(a.id) || new Set();
                const depsB = dependencyMap.get(b.id) || new Set();
                // If neither depends on the other, they can be parallel
                if (!depsA.has(b.id) && !depsB.has(a.id)) {
                    // Check for indirect dependencies
                    const aAncestors = this.getAncestors(a.id, graph);
                    const bAncestors = this.getAncestors(b.id, graph);
                    if (!aAncestors.has(b.id) && !bAncestors.has(a.id)) {
                        graph.edges.push({
                            from: a.id,
                            to: b.id,
                            type: 'parallel_with',
                        });
                    }
                }
            }
        }
        return graph;
    }
    /**
     * Get all ancestor nodes
     */
    getAncestors(nodeId, graph) {
        const ancestors = new Set();
        const visit = (id) => {
            for (const edge of graph.edges) {
                if (edge.to === id && edge.type === 'depends_on' && !ancestors.has(edge.from)) {
                    ancestors.add(edge.from);
                    visit(edge.from);
                }
            }
        };
        visit(nodeId);
        return ancestors;
    }
    /**
     * Estimate execution time for a task graph
     */
    estimateTime(graph) {
        const taskTime = 30000; // 30s per task average
        const parallelGroups = this.findParallelGroups(graph);
        return parallelGroups.length * taskTime;
    }
    /**
     * Estimate token usage for a task graph
     */
    estimateTokens(graph) {
        return graph.nodes.length * 2000; // ~2k tokens per task
    }
    /**
     * Find groups of tasks that can run in parallel
     */
    findParallelGroups(graph) {
        const groups = [];
        const visited = new Set();
        for (const node of graph.nodes) {
            if (visited.has(node.id))
                continue;
            const group = [node.id];
            visited.add(node.id);
            for (const other of graph.nodes) {
                if (visited.has(other.id))
                    continue;
                const canParallel = graph.edges.some(e => (e.from === node.id && e.to === other.id && e.type === 'parallel_with') ||
                    (e.from === other.id && e.to === node.id && e.type === 'parallel_with'));
                if (canParallel) {
                    group.push(other.id);
                    visited.add(other.id);
                }
            }
            groups.push(group);
        }
        return groups;
    }
}
export default TaskDecomposer;
//# sourceMappingURL=decomposer.js.map