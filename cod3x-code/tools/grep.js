import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

export async function execute(params) {
  const { 
    pattern, 
    path: searchPath = '.', 
    type = null, 
    caseSensitive = false,
    context = 2,
    maxMatches = 100
  } = params;
  
  try {
    let filePattern = '**/*';
    if (type === 'js') filePattern = '**/*.{js,jsx,mjs,ts,tsx}';
    else if (type === 'py') filePattern = '**/*.py';
    else if (type === 'go') filePattern = '**/*.go';
    else if (type === 'rs') filePattern = '**/*.rs';
    else if (type === 'md') filePattern = '**/*.md';
    else if (type === 'json') filePattern = '**/*.json';
    
    const files = await glob(filePattern, {
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', '__pycache__/**', 'target/**'],
      cwd: searchPath,
      absolute: false,
      nodir: true
    });
    
    const regexFlags = caseSensitive === 'true' ? 'g' : 'gi';
    let regex;
    try {
      regex = new RegExp(pattern, regexFlags);
    } catch (error) {
      return { success: false, error: `Invalid regex pattern: ${error.message}` };
    }
    
    const matches = [];
    
    for (const file of files.slice(0, 100)) {
      if (matches.length >= maxMatches) break;
      
      try {
        const content = await fs.readFile(path.join(searchPath, file), 'utf-8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            const start = Math.max(0, i - context);
            const end = Math.min(lines.length, i + context + 1);
            const contextLines = lines.slice(start, end).map((line, idx) => {
              const lineNum = start + idx + 1;
              const marker = lineNum === i + 1 ? '>' : ' ';
              return `${marker} ${String(lineNum).padStart(4, ' ')} | ${line.slice(0, 120)}`;
            }).join('\n');
            
            matches.push({
              file: file,
              line: i + 1,
              content: lines[i].trim().slice(0, 200),
              context: contextLines
            });
            
            if (matches.length >= maxMatches) break;
          }
        }
      } catch (error) {
        // Skip unreadable files
      }
    }
    
    if (matches.length === 0) {
      return {
        success: true,
        output: `No matches found for "${pattern}"`,
        matches: [],
        count: 0
      };
    }
    
    const output = matches.map(m => 
      `\n📄 ${m.file}:${m.line}\n${'─'.repeat(50)}\n${m.context}`
    ).join('\n');
    
    return {
      success: true,
      output: `Found ${matches.length} match(es):\n${output}`,
      matches: matches,
      count: matches.length,
      truncated: matches.length >= maxMatches
    };
  } catch (error) {
    return {
      success: false,
      error: `Grep failed: ${error.message}`
    };
  }
}

export const metadata = {
  name: 'grep',
  description: 'Search code with regex and show context',
  parameters: ['pattern', 'path', 'type', 'caseSensitive', 'context', 'maxMatches'],
  requiresApproval: false,
  category: 'search'
};
