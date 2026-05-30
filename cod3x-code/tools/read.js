import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const fileCache = new Map();
const MAX_CACHE_SIZE = 50;

export async function execute(params) {
  const { path: filePath, startLine = 1, endLine = null, encoding = 'utf-8', useCache = true } = params;
  
  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    
    // Security: Prevent path traversal
    if (!absolutePath.startsWith(process.cwd())) {
      return { success: false, error: 'Security: Cannot read outside project directory' };
    }
    
    const stats = await fs.stat(absolutePath);
    
    // Limit file size
    if (stats.size > 10 * 1024 * 1024) {
      return { success: false, error: `File too large: ${(stats.size / 1024 / 1024).toFixed(1)}MB (max 10MB)` };
    }
    
    // Check cache
    const cacheKey = `${absolutePath}:${stats.mtimeMs}`;
    let content;
    
    if (useCache && fileCache.has(cacheKey)) {
      content = fileCache.get(cacheKey);
    } else {
      content = await fs.readFile(absolutePath, encoding);
      
      if (fileCache.size >= MAX_CACHE_SIZE) {
        const firstKey = fileCache.keys().next().value;
        fileCache.delete(firstKey);
      }
      fileCache.set(cacheKey, content);
    }
    
    const lines = content.split('\n');
    const start = Math.max(0, startLine - 1);
    const end = endLine ? Math.min(lines.length, endLine) : lines.length;
    const selected = lines.slice(start, end);
    
    // Add line numbers with color indicators
    const numbered = selected.map((line, idx) => {
      const lineNum = start + idx + 1;
      const lineNumStr = String(lineNum).padStart(6, ' ');
      return `${lineNumStr} │ ${line}`;
    }).join('\n');
    
    return {
      success: true,
      content: selected.join('\n'),
      output: numbered,
      lineCount: selected.length,
      totalLines: lines.length,
      size: stats.size,
      encoding: encoding,
      path: filePath
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: false, error: `File not found: ${filePath}` };
    }
    if (error.code === 'EACCES') {
      return { success: false, error: `Permission denied: ${filePath}` };
    }
    return { success: false, error: `Read error: ${error.message}` };
  }
}

export const metadata = {
  name: 'read',
  description: 'Read file contents with line numbers and caching',
  parameters: ['path', 'startLine', 'endLine', 'encoding'],
  requiresApproval: false,
  category: 'filesystem'
};
