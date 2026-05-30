import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function execute(args = []) {
  console.log('\n🔍 Cod3x System Check\n');
  console.log('═'.repeat(50));
  
  const checks = [];
  
  // Node.js version
  try {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    const isOk = major >= 18;
    checks.push({
      name: 'Node.js',
      status: isOk ? '✅' : '⚠️',
      value: version,
      message: isOk ? '' : 'Version 18+ recommended'
    });
  } catch (error) {
    checks.push({ name: 'Node.js', status: '❌', value: 'Not found', message: 'Install Node.js 18+' });
  }
  
  // npm
  try {
    const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
    checks.push({ name: 'npm', status: '✅', value: version, message: '' });
  } catch {
    checks.push({ name: 'npm', status: '❌', value: 'Not found', message: 'npm is required' });
  }
  
  // Git
  try {
    const version = execSync('git --version', { encoding: 'utf-8' }).trim();
    checks.push({ name: 'Git', status: '✅', value: version.split(' ')[2], message: '' });
  } catch {
    checks.push({ name: 'Git', status: '⚠️', value: 'Not found', message: 'Optional, but recommended' });
  }
  
  // OpenRouter API Key
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  checks.push({
    name: 'OpenRouter API Key',
    status: apiKey ? '✅' : '⚠️',
    value: apiKey ? `${apiKey.slice(0, 10)}...` : 'Not set',
    message: apiKey ? '' : 'Set OPENROUTER_API_KEY for AI features'
  });
  
  // Project directory
  const hasPackageJson = await fs.access('package.json').then(() => true).catch(() => false);
  checks.push({
    name: 'Project',
    status: hasPackageJson ? '✅' : 'ℹ️',
    value: path.basename(process.cwd()),
    message: hasPackageJson ? '' : 'Not a Node.js project'
  });
  
  // .cod3xrc
  const hasConfig = await fs.access('.cod3xrc').then(() => true).catch(() => false);
  checks.push({
    name: 'Configuration',
    status: hasConfig ? '✅' : 'ℹ️',
    value: '.cod3xrc',
    message: hasConfig ? '' : 'Run `cod3x init` to create config'
  });
  
  // Disk space
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const { stdout } = await execAsync('df -h .');
    const space = stdout.split('\n')[1].split(/\s+/)[3];
    checks.push({ name: 'Disk Space', status: '✅', value: `Available: ${space}`, message: '' });
  } catch {
    checks.push({ name: 'Disk Space', status: 'ℹ️', value: 'Unknown', message: '' });
  }
  
  // Memory
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memPercent = (freeMem / totalMem * 100).toFixed(1);
  checks.push({
    name: 'Memory',
    status: freeMem > 500 * 1024 * 1024 ? '✅' : '⚠️',
    value: `${Math.round(freeMem / 1024 / 1024)}MB free (${memPercent}%)`,
    message: freeMem < 500 * 1024 * 1024 ? 'Low memory available' : ''
  });
  
  // Display results
  for (const check of checks) {
    const statusColor = check.status === '✅' ? '\x1b[32m' : (check.status === '⚠️' ? '\x1b[33m' : '\x1b[31m');
    console.log(`${statusColor}${check.status}\x1b[0m  ${check.name.padEnd(20)} ${check.value.padEnd(25)} ${check.message}`);
  }
  
  console.log('\n' + '═'.repeat(50));
  
  // Summary
  const issues = checks.filter(c => c.status === '❌');
  const warnings = checks.filter(c => c.status === '⚠️');
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('\n✅ All systems ready! Run `cod3x` to start.\n');
  } else if (issues.length > 0) {
    console.log(`\n❌ ${issues.length} critical issue(s) found. Please fix them before proceeding.\n`);
  } else {
    console.log(`\n⚠️ ${warnings.length} warning(s) found. Cod3x will work with limited functionality.\n`);
  }
  
  // Recommendations
  if (!apiKey) {
    console.log('💡 Get a free API key: https://openrouter.ai/keys');
    console.log('   Then run: export OPENROUTER_API_KEY=your-key\n');
  }
  
  if (!hasConfig) {
    console.log('💡 Initialize Cod3x: cod3x init\n');
  }
}

export default { execute };
