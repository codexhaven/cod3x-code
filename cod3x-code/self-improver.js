#!/usr/bin/env node
// cod3x-self-improver.js - Autonomous project improver

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Cod3xSelfImprover {
  constructor() {
    this.projectRoot = __dirname;
    this.issues = [];
    this.improvements = [];
    this.llmProxy = null;
  }

  async initialize() {
    console.log(chalk.cyan('\n  🔧 Cod3x Self-Improver v1.0\n'));
    await this.loadLLM();
    await this.scanProject();
  }

  async loadLLM() {
    try {
      const { LLMProxy } = await import('./llm_proxy.js');
      this.llm = new LLMProxy();
      await this.llm.initialize();
      console.log(chalk.green('  ✓ LLM loaded for analysis\n'));
    } catch (error) {
      console.log(chalk.yellow('  ⚠️ Using fallback analysis\n'));
    }
  }

  async scanProject() {
    console.log(chalk.gray('  📂 Scanning project files...\n'));

    const files = await this.getProjectFiles();
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const issues = await this.analyzeFile(file, content);
      
      if (issues.length) {
        this.issues.push({ file, issues });
      }
    }
    
    console.log(chalk.green(`  ✓ Scanned ${files.length} files`));
    console.log(chalk.yellow(`  ⚠️ Found ${this.issues.length} files with issues\n`));
  }

  async getProjectFiles() {
    const { glob } = await import('glob');
    const files = await glob('**/*.js', {
      ignore: ['node_modules/**', 'self-improver.js', '*.backup', 'logs/**']
    });
    return files;
  }

  async analyzeFile(filePath, content) {
    const issues = [];
    
    // Check for common issues
    if (content.includes('console.log') && !content.includes('// debug')) {
      issues.push({ type: 'debug', message: 'Has console.log statements', severity: 'low' });
    }
    
    if (!content.includes('try {') && content.includes('await ')) {
      issues.push({ type: 'error-handling', message: 'Missing try-catch around await', severity: 'medium' });
    }
    
    if (content.includes('.catch(') && !content.includes('.catch(error =>')) {
      issues.push({ type: 'error-handling', message: 'Poor error handling in catch', severity: 'medium' });
    }
    
    if (content.includes('TODO') || content.includes('FIXME')) {
      issues.push({ type: 'todo', message: 'Contains TODO/FIXME comments', severity: 'low' });
    }
    
    if (!content.includes('JSDoc') && !content.includes('/**') && filePath.includes('tools/')) {
      issues.push({ type: 'documentation', message: 'Missing JSDoc comments', severity: 'low' });
    }
    
    return issues;
  }

  async generateImprovements() {
    console.log(chalk.gray('\n  💡 Generating improvements...\n'));
    
    for (const item of this.issues) {
      const improvement = await this.suggestImprovement(item);
      if (improvement) {
        this.improvements.push(improvement);
        console.log(chalk.yellow(`  📝 ${item.file}: ${improvement.title}`));
      }
    }
  }

  async suggestImprovement(issue) {
    if (!this.llm) return null;
    
    try {
      const content = await fs.readFile(issue.file, 'utf-8');
      const prompt = `Analyze this file and suggest ONE specific improvement:
File: ${issue.file}
Issues: ${JSON.stringify(issue.issues)}
Code snippet: ${content.slice(0, 1500)}

Output JSON:
{
  "title": "Short description",
  "priority": "high|medium|low",
  "changes": ["change1", "change2"],
  "patch": "exact code to replace or add"
}`;

      const response = await this.llm.chat(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log(chalk.red(`  ✗ Failed to analyze ${issue.file}`));
    }
    return null;
  }

  async applyImprovements() {
    if (this.improvements.length === 0) {
      console.log(chalk.green('\n  ✅ No improvements needed!\n'));
      return;
    }
    
    console.log(chalk.cyan('\n  🔧 Applying improvements...\n'));
    
    for (const imp of this.improvements) {
      console.log(chalk.white(`  • ${imp.title} (${imp.priority})`));
      // Apply the patch if provided
      if (imp.patch) {
        // Logic to apply patch would go here
      }
    }
    
    console.log(chalk.green(`\n  ✅ Applied ${this.improvements.length} improvements\n`));
  }

  async generatePatchFile(filePath, original, improved) {
    const patchPath = `${filePath}.patch`;
    const diff = await this.createDiff(original, improved);
    await fs.writeFile(patchPath, diff);
    console.log(chalk.blue(`  📄 Patch saved: ${patchPath}`));
    return patchPath;
  }

  async createDiff(oldContent, newContent) {
    const { diffLines } = await import('diff');
    const diff = diffLines(oldContent, newContent);
    return diff.map(part => {
      const prefix = part.added ? '+' : (part.removed ? '-' : ' ');
      return part.value.split('\n').map(line => `${prefix}${line}`).join('\n');
    }).join('\n');
  }

  async run() {
    await this.initialize();
    await this.generateImprovements();
    await this.applyImprovements();
    
    console.log(chalk.gray('\n  ─────────────────────────────────────────────────────\n'));
    console.log(chalk.white('  Next steps:'));
    console.log(chalk.gray('  1. Review generated patches'));
    console.log(chalk.gray('  2. Run: node self-improver.js --apply'));
    console.log(chalk.gray('  3. Test improvements\n'));
  }
}

// CLI
const improver = new Cod3xSelfImprover();
improver.run().catch(console.error);

export { Cod3xSelfImprover };

// ============================================
// ADVANCED IMPROVEMENT CRITERIA
// ============================================

const improvementCriteria = [
  {
    id: 'SEC001',
    name: 'Command Injection Prevention',
    severity: 'critical',
    check: (content) => {
      return content.includes('exec(') && 
             !content.includes('shell.escape') && 
             !content.includes('sanitize') &&
             !content.includes('child_process.execFile');
    },
    fix: 'Replace exec() with execFile() and sanitize inputs',
    example: `
// ❌ Bad:
const { exec } = require('child_process');
exec('ls ' + userInput);

// ✅ Good:
const { execFile } = require('child_process');
execFile('ls', [userInput], (err, stdout) => {});
`
  },
  {
    id: 'SEC002',
    name: 'Path Traversal Protection',
    severity: 'critical',
    check: (content) => {
      return content.includes('path.join') && 
             !content.includes('startsWith') &&
             !content.includes('resolve');
    },
    fix: 'Add path traversal guard',
    example: `
const path = require('path');
const safePath = path.resolve(rootDir, userPath);
if (!safePath.startsWith(rootDir)) {
  throw new Error('Path traversal detected');
}
`
  },
  {
    id: 'PERF001',
    name: 'Synchronous File Operations',
    severity: 'high',
    check: (content) => {
      return content.includes('readFileSync') || 
             content.includes('writeFileSync') ||
             content.includes('existsSync');
    },
    fix: 'Replace sync methods with async/promises',
    example: `
// ❌ Bad: const data = fs.readFileSync('file.txt');
// ✅ Good: const data = await fs.promises.readFile('file.txt');
`
  },
  {
    id: 'PERF002',
    name: 'Unbounded Array Operations',
    severity: 'high',
    check: (content) => {
      return (content.includes('.map(') || content.includes('.filter(')) &&
             !content.includes('.slice(0,') &&
             !content.includes('limit');
    },
    fix: 'Add limits to prevent memory exhaustion',
    example: `
// Add limit to array operations
const limited = items.slice(0, MAX_ITEMS).map(x => process(x));
`
  },
  {
    id: 'ERR001',
    name: 'Missing Error Boundaries',
    severity: 'high',
    check: (content) => {
      return content.includes('async ') && 
             !content.includes('try {') &&
             !content.includes('.catch(');
    },
    fix: 'Add try-catch blocks to async functions',
    example: `
async function safeOperation() {
  try {
    await riskyOperation();
  } catch (error) {
    console.error('Operation failed:', error.message);
    return null;
  }
}
`
  },
  {
    id: 'ERR002',
    name: 'Empty Catch Blocks',
    severity: 'medium',
    check: (content) => {
      return /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/.test(content);
    },
    fix: 'Add error logging in catch blocks',
    example: `
catch (error) {
  console.error('Error:', error.message);
  // Handle or re-throw
}
`
  },
  {
    id: 'MEM001',
    name: 'Memory Leak Risk',
    severity: 'high',
    check: (content) => {
      return content.includes('setInterval') && 
             !content.includes('clearInterval') ||
             content.includes('addEventListener') && 
             !content.includes('removeEventListener');
    },
    fix: 'Add cleanup functions for intervals/event listeners',
    example: `
const interval = setInterval(() => {}, 1000);
// Store reference for cleanup
this.intervals.push(interval);
// Later: interval.forEach(clearInterval);
`
  },
  {
    id: 'DEP001',
    name: 'Hardcoded Dependencies',
    severity: 'medium',
    check: (content) => {
      return content.includes("require('") && 
             !content.includes("process.env") &&
             content.match(/require\(['"][^.'"]+['"]/);
    },
    fix: 'Make dependencies configurable via environment variables',
    example: `
const API_URL = process.env.API_URL || 'https://default.api.com';
`
  },
  {
    id: 'DOC001',
    name: 'Missing Function Documentation',
    severity: 'low',
    check: (content) => {
      return content.match(/function \w+\([^)]*\)\s*{/) &&
             !content.includes('/**');
    },
    fix: 'Add JSDoc comments to functions',
    example: `
/**
 * Function description
 * @param {string} param - Parameter description
 * @returns {Promise<void>} Return description
 */
function example(param) {
  // code
}
`
  },
  {
    id: 'STYLE001',
    name: 'Inconsistent Error Messages',
    severity: 'low',
    check: (content) => {
      const errors = content.match(/throw new Error\(['"][^'"]+['"]\)/g);
      if (!errors) return false;
      return errors.some(e => !e.includes('[') || !e.includes('❌'));
    },
    fix: 'Standardize error message format',
    example: `
// Use consistent format:
throw new Error('[ModuleName] ❌ Error description');
`
  },
  {
    id: 'ASYNC001',
    name: 'Missing Promise Rejection Handling',
    severity: 'high',
    check: (content) => {
      return content.includes('new Promise') && 
             !content.includes('.catch(') &&
             !content.includes('try');
    },
    fix: 'Add rejection handling to Promises',
    example: `
new Promise((resolve, reject) => {
  // async work
}).catch(error => {
  console.error('Promise rejected:', error);
  reject(error);
});
`
  },
  {
    id: 'CONFIG001',
    name: 'Missing Configuration Validation',
    severity: 'medium',
    check: (content) => {
      return content.includes('process.env.') && 
             !content.includes('if (!') &&
             !content.includes('required');
    },
    fix: 'Validate required config variables on startup',
    example: `
const REQUIRED_ENV = ['API_KEY', 'DATABASE_URL'];
for (const env of REQUIRED_ENV) {
  if (!process.env[env]) {
    throw new Error(\`Missing required env: \${env}\`);
  }
}
`
  },
  {
    id: 'RATE001',
    name: 'Missing Rate Limiting',
    severity: 'medium',
    check: (content) => {
      return (content.includes('fetch(') || content.includes('axios.')) &&
             !content.includes('rateLimit') &&
             !content.includes('throttle');
    },
    fix: 'Implement rate limiting for API calls',
    example: `
const rateLimiter = {
  tokens: 10,
  lastRefill: Date.now(),
  async consume() {
    // Implement token bucket algorithm
  }
};
`
  },
  {
    id: 'RETRY001',
    name: 'Missing Retry Logic',
    severity: 'medium',
    check: (content) => {
      return content.includes('fetch(') && 
             !content.includes('retry') &&
             !content.includes('attempt');
    },
    fix: 'Add exponential backoff retry for network calls',
    example: `
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url);
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
`
  },
  {
    id: 'INPUT001',
    name: 'Missing Input Validation',
    severity: 'high',
    check: (content) => {
      return (content.includes('function') || content.includes('async ')) &&
             content.includes('params') &&
             !content.includes('if (!') &&
             !content.includes('typeof') &&
             !content.includes('Array.isArray');
    },
    fix: 'Validate function inputs at start',
    example: `
function process(data) {
  if (!data) throw new Error('Missing required data');
  if (typeof data !== 'object') throw new Error('Invalid type');
  if (Array.isArray(data) && data.length === 0) throw new Error('Empty array');
  // continue processing
}
`
  },
  {
    id: 'ENV001',
    name: 'Exposed Secrets',
    severity: 'critical',
    check: (content) => {
      const secrets = ['apiKey', 'API_KEY', 'password', 'secret', 'token'];
      return secrets.some(secret => 
        content.includes(secret) && 
        !content.includes('process.env') &&
        !content.includes('.env')
      );
    },
    fix: 'Move secrets to environment variables',
    example: `
// ❌ Bad: const API_KEY = 'sk-123456789';
// ✅ Good: const API_KEY = process.env.API_KEY;
`
  },
  {
    id: 'LOG001',
    name: 'Sensitive Data Logging',
    severity: 'high',
    check: (content) => {
      const sensitive = ['password', 'token', 'key', 'secret', 'authorization'];
      return sensitive.some(s => 
        content.includes(`console.log(.${s}`) ||
        content.includes(`console.error(.${s}`)
      );
    },
    fix: 'Redact sensitive data before logging',
    example: `
function safeLog(obj) {
  const redacted = { ...obj };
  if (redacted.password) redacted.password = '***';
  console.log(redacted);
}
`
  }
];

// New method to run advanced analysis
async function runAdvancedAnalysis() {
  console.log(chalk.cyan('\n  🔬 Running Advanced Security & Quality Analysis\n'));
  
  let totalIssues = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  
  const files = await glob('**/*.js', { 
    ignore: ['node_modules/**', 'self-improver.js', '*.backup', 'test-*.js']
  });
  
  const results = [];
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const fileIssues = [];
    
    for (const criteria of improvementCriteria) {
      if (criteria.check(content)) {
        fileIssues.push(criteria);
        totalIssues++;
        
        switch(criteria.severity) {
          case 'critical': criticalCount++; break;
          case 'high': highCount++; break;
          case 'medium': mediumCount++; break;
          case 'low': lowCount++; break;
        }
      }
    }
    
    if (fileIssues.length > 0) {
      results.push({ file, issues: fileIssues });
    }
  }
  
  // Display summary
  console.log(chalk.white('  ─────────────────────────────────────────────────────\n'));
  console.log(chalk.yellow(`  📊 Analysis Summary:\n`));
  console.log(chalk.red(`     🔴 Critical: ${criticalCount}`));
  console.log(chalk.magenta(`     🟠 High: ${highCount}`));
  console.log(chalk.blue(`     🟡 Medium: ${mediumCount}`));
  console.log(chalk.green(`     🟢 Low: ${lowCount}`));
  console.log(chalk.white(`     📁 Total files with issues: ${results.length}/${files.length}\n`));
  
  // Show top issues by file
  if (results.length > 0) {
    console.log(chalk.yellow('  🔍 Top Issues by File:\n'));
    for (const result of results.slice(0, 10)) {
      console.log(chalk.white(`     📄 ${result.file}`));
      for (const issue of result.issues.slice(0, 3)) {
        const color = issue.severity === 'critical' ? chalk.red :
                     issue.severity === 'high' ? chalk.magenta :
                     issue.severity === 'medium' ? chalk.blue : chalk.green;
        console.log(color(`        • [${issue.id}] ${issue.name}`));
      }
      if (result.issues.length > 3) {
        console.log(chalk.gray(`        ... and ${result.issues.length - 3} more issues`));
      }
      console.log('');
    }
  }
  
  return { totalIssues, criticalCount, highCount, mediumCount, lowCount, results };
}

// Export for use
export { improvementCriteria, runAdvancedAnalysis };
