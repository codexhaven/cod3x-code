import fs from 'fs/promises';
import path from 'path';

export async function execute(params) {
  const { path: dirPath = '.', showHidden = false, longFormat = true } = params;
  
  try {
    const absolutePath = path.resolve(process.cwd(), dirPath);
    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    
    const items = [];
    for (const entry of entries) {
      if (!showHidden && entry.name.startsWith('.')) continue;
      
      const fullPath = path.join(absolutePath, entry.name);
      let stats;
      try {
        stats = await fs.stat(fullPath);
      } catch (error) {
        stats = { size: 0, mtime: new Date(), mode: 0o644 };
      }
      
      const type = entry.isDirectory() ? '📁' : (entry.isFile() ? '📄' : '🔗');
      const size = entry.isFile() ? `${(stats.size / 1024).toFixed(1)}KB` : '';
      const modified = stats.mtime.toLocaleDateString();
      const perms = this.formatPermissions(stats.mode);
      
      items.push({
        name: entry.name,
        type: entry.isDirectory() ? 'dir' : 'file',
        size: stats.size,
        modified: stats.mtime,
        display: longFormat 
          ? `${type} ${perms.padEnd(10)} ${size.padStart(10)} ${modified.padEnd(12)} ${entry.name}`
          : `${type} ${entry.name}`
      });
    }
    
    // Sort: directories first, then files
    const sorted = items.sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });
    
    const output = sorted.map(item => item.display).join('\n');
    
    return {
      success: true,
      output: `\n${dirPath}:\n${output}\n`,
      items: sorted,
      count: sorted.length,
      path: dirPath
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: false, error: `Directory not found: ${dirPath}` };
    }
    return { success: false, error: `List failed: ${error.message}` };
  }
}

function formatPermissions(mode) {
  const perms = [
    mode & 0o400 ? 'r' : '-',
    mode & 0o200 ? 'w' : '-',
    mode & 0o100 ? 'x' : '-',
    mode & 0o040 ? 'r' : '-',
    mode & 0o020 ? 'w' : '-',
    mode & 0o010 ? 'x' : '-',
    mode & 0o004 ? 'r' : '-',
    mode & 0o002 ? 'w' : '-',
    mode & 0o001 ? 'x' : '-'
  ].join('');
  return perms;
}

export const metadata = {
  name: 'ls',
  description: 'List directory contents with file info',
  parameters: ['path', 'showHidden', 'longFormat'],
  requiresApproval: false,
  category: 'filesystem'
};
