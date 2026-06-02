import { ToolDefinition } from '@codex-types/index';
import { execSync } from 'child_process';

export const definition: ToolDefinition = {
  name: 'db_migrate',
  description: 'Database migration management (status, up, down, create)',
  category: 'database',
  requiresApproval: true,
  parameters: [
    { name: 'direction', type: 'string', description: 'up|down|status|create', required: true },
    { name: 'name', type: 'string', description: 'Migration name (for create)', required: false },
  ],
  handler: async (params, context): Promise<any> => {
    const direction = params.direction as string;
    
    try {
      let output = '';
      
      if (direction === 'create' && params.name) {
        const timestamp = Date.now();
        const filename = `migrations/${timestamp}_${params.name}.sql`;
        const fs = await import('fs/promises');
        await fs.mkdir('migrations', { recursive: true });
        await fs.writeFile(filename, `-- Migration: ${params.name}\n-- Up\n\n-- Down\n`, 'utf-8');
        output = `Created migration: ${filename}`;
      } else if (['up', 'down', 'status'].includes(direction)) {
        output = execSync(`npx knex migrate:${direction} 2>/dev/null || echo "Install knex for migration support"`, { cwd: context.cwd, encoding: 'utf-8' }).trim();
      } else {
        return { success: false, output: '', error: `Unknown direction: ${direction}` };
      }
      
      return { success: true, output };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  },
};
