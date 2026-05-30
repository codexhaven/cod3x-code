import { glob } from 'glob';
import path from 'path';

const searchCache = new Map();
const CACHE_TTL = 60000;

export async function execute(params) {
  const { pattern, ignore = 'node_modules/**,.git/**,dist/**', limit = 100, absolute = false } = params;
  
  const cacheKey = `${pattern}:${ignore}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  
  try {
    const ignorePatterns = ignore.split(',').map(i => i.trim());
    const files = await glob(pattern, {
      ignore: ignorePatterns,
      nodir: true,
      absolute: absolute === 'true',
      follow: false,
      dot: false
    });
    
    const limited = files.slice(0, limit);
    const result = {
      success: true,
      files: limited,
      count: files.length,
      truncated: files.length > limit,
      output: `Found ${files.length} file(s) matching "${pattern}"${files.length > limit ? ` (showing first ${limit})` : ''}:\n${limited.map(f => `  ${f}`).join('\n')}`
    };
    
    searchCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  } catch (error) {
    return {
      success: false,
      error: `Glob failed: ${error.message}`,
      files: [],
      count: 0
    };
  }
}

export const metadata = {
  name: 'glob',
  description: 'Find files matching pattern with glob syntax',
  parameters: ['pattern', 'ignore', 'limit', 'absolute'],
  requiresApproval: false,
  category: 'search'
};
