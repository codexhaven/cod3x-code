import { ToolDefinition } from '@codex-types/index';
import { execSync } from 'child_process';

export const definition: ToolDefinition = {
  name: 'db_query',
  description: 'Execute SQL queries against databases (sqlite, psql, mysql)',
  category: 'database',
  requiresApproval: true,
  parameters: [
    { name: 'connection', type: 'string', description: 'DB connection string or path', required: true },
    { name: 'query', type: 'string', description: 'SQL query', required: true },
  ],
  handler: async (params, context): Promise<any> => {
    const connection = params.connection as string;
    const query = params.query as string;
    
    try {
      let cmd = '';
      if (connection.endsWith('.db') || connection.endsWith('.sqlite')) {
        cmd = `sqlite3 "${connection}" "${query.replace(/"/g, '\\"')}"`;
      } else if (connection.includes('postgresql')) {
        cmd = `psql "${connection}" -c "${query}"`;
      } else {
        return { success: false, output: '', error: 'Unsupported database. Use sqlite3, postgresql connection strings.' };
      }
      
      const output = execSync(cmd, { cwd: context.cwd, encoding: 'utf-8', maxBuffer: 1024 * 1024 }).trim();
      return { success: true, output: output || 'Query executed (no output)' };
    } catch (error: any) {
      return { success: false, output: '', error: error.stderr?.toString() || error.message };
    }
  },
};
