import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { glob } from 'glob';

export async function gatherContext() {
  const context = {
    project: path.basename(process.cwd()),
    files: [],
    fileCount: 0,
    git: null,
    timestamp: Date.now()
  };
  
  // Get project name
  try {
    const pkgContent = await fs.readFile('package.json', 'utf-8');
    const pkg = JSON.parse(pkgContent);
    context.project = pkg.name || context.project;
  } catch (error) {}
  
  // Get git info
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    if (branch) context.git = { branch: branch };
  } catch (error) {}
  
  // Load patterns from .cod3xrc config
  let includePatterns = ['**/*.js', '**/*.py', '**/*.md', '**/*.json'];
  let excludePatterns = ['node_modules/**', '.git/**', 'dist/**'];
  
  try {
    const configPath = path.join(process.cwd(), '.cod3xrc');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    if (config.context) {
      // Use the correct field names from your config
      includePatterns = config.context.includePatterns || includePatterns;
      excludePatterns = config.context.excludePatterns || excludePatterns;
    }
  } catch (error) {
    console.log('  ⚠️ Could not read .cod3xrc, using default patterns');
  }
  
  // Ensure they are arrays
  if (!Array.isArray(includePatterns)) includePatterns = [includePatterns];
  if (!Array.isArray(excludePatterns)) excludePatterns = [excludePatterns];
  
  console.log(`  📁 Scanning with ${includePatterns.length} patterns...`);
  
  // Gather files
  const allFiles = [];
  for (const pattern of includePatterns) {
    try {
      const matches = await glob(pattern, { 
        ignore: excludePatterns, 
        nodir: true,
        absolute: false
      });
      allFiles.push(...matches);
    } catch (error) {
      console.log(`  ⚠️ Pattern failed: ${pattern}`);
    }
  }
  
  context.files = [...new Set(allFiles)].slice(0, 100);
  context.fileCount = context.files.length;
  
  console.log(`  ✓ Found ${context.fileCount} files`);
  
  return context;
}

export default { gatherContext };
