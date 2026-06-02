import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import { PlatformDetector } from '@platform/detector';

export const doctorCommand = {
  name: 'doctor',
  description: 'Run system diagnostics for Cod3x',
  
  async execute(): Promise<void> {
    console.log(chalk.cyan('\n  Cod3x Code v4.0 - System Diagnostics by CodexHaven\n'));
    
    const checks: { name: string; status: 'ok' | 'warn' | 'error'; message: string }[] = [];
    
    // Node.js version
    try {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0]);
      checks.push({ name: 'Node.js', status: major >= 18 ? 'ok' : 'warn', message: version });
    } catch (e: any) {
      checks.push({ name: 'Node.js', status: 'error', message: e.message });
    }
    
    // Platform detection
    try {
      const detector = PlatformDetector.getInstance();
      const platform = await detector.detect();
      checks.push({ name: 'Platform', status: 'ok', message: `${platform.type} (${platform.shell})` });
    } catch (e: any) {
      checks.push({ name: 'Platform', status: 'warn', message: e.message });
    }
    
    // Git
    try {
      const git = execSync('git --version', { encoding: 'utf-8' }).trim();
      checks.push({ name: 'Git', status: 'ok', message: git });
    } catch {
      checks.push({ name: 'Git', status: 'warn', message: 'Not installed' });
    }
    
    // opencode-free-proxy
    try {
      const http = await import('http');
      await new Promise<void>((resolve, reject) => {
        const req = http.request({ hostname: 'localhost', port: 8000, path: '/v1/models', method: 'GET', timeout: 3000 },
          (res) => resolve());
        req.on('error', () => reject());
        req.on('timeout', () => { req.destroy(); reject(); });
        req.end();
      });
      checks.push({ name: 'opencode-proxy', status: 'ok', message: 'Running on localhost:8000' });
    } catch {
      checks.push({ name: 'opencode-proxy', status: 'warn', message: 'Not running. Install: github.com/sionex-code/opencode-proxy-api' });
    }
    
    // .cod3xrc
    try {
      await fs.access('.cod3xrc');
      checks.push({ name: 'Config', status: 'ok', message: '.cod3xrc found' });
    } catch {
      checks.push({ name: 'Config', status: 'warn', message: 'Run: cod3x init' });
    }
    
    // Display results
    for (const check of checks) {
      const icon = check.status === 'ok' ? chalk.green('✓') : check.status === 'warn' ? chalk.yellow('⚠') : chalk.red('✗');
      const color = check.status === 'ok' ? chalk.green : check.status === 'warn' ? chalk.yellow : chalk.red;
      console.log(`  ${icon} ${check.name.padEnd(15)} ${color(check.message)}`);
    }
    
    console.log(chalk.gray(`\n  Cod3x Code v4.0 by CodexHaven - https://github.com/codexhaven/cod3x-code\n`));
  },
};

export default doctorCommand;
