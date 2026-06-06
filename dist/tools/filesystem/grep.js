import { execSync } from 'child_process';
export const definition = {
    name: 'grep_search',
    description: 'Search file contents with regex, context lines, and case sensitivity options',
    category: 'filesystem',
    requiresApproval: false,
    parameters: [
        { name: 'pattern', type: 'string', description: 'Search pattern', required: true },
        { name: 'path', type: 'string', description: 'Search path', required: false, default: '.' },
        { name: 'caseSensitive', type: 'boolean', description: 'Case sensitive', required: false },
        { name: 'context', type: 'number', description: 'Context lines', required: false, default: 2 },
        { name: 'maxMatches', type: 'number', description: 'Max matches', required: false, default: 50 },
    ],
    handler: async (params, context) => {
        const pattern = params.pattern;
        const searchPath = params.path || '.';
        const caseFlag = params.caseSensitive ? '' : '-i';
        const ctx = params.context || 2;
        const max = params.maxMatches || 50;
        try {
            const cmd = `grep -r -n ${caseFlag} -C ${ctx} --include="*.*" -m ${max} "${pattern}" "${searchPath}" 2>/dev/null || true`;
            const output = execSync(cmd, { cwd: context.cwd, encoding: 'utf-8', maxBuffer: 1024 * 1024 }).trim();
            return {
                success: true,
                output: output || `No matches for "${pattern}"`,
                data: { pattern, matches: output ? output.split('\n').filter(l => l.includes(':')).length : 0 },
            };
        }
        catch (error) {
            return { success: false, output: '', error: error.message };
        }
    },
};
//# sourceMappingURL=grep.js.map