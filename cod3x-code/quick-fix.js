#!/usr/bin/env node
import fs from 'fs/promises';
import chalk from 'chalk';

const quickFixes = [
  {
    file: 'tools/ls.js',
    issue: 'Missing formatPermissions function',
    fix: `
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
}`
  },
  {
    file: 'tools/bash.js',
    issue: 'Add parameter validation',
    fix: `
export function validate(params) {
  if (!params.command) {
    return { valid: false, error: 'Missing required parameter: command' };
  }
  return { valid: true };
}`
  }
];

for (const fix of quickFixes) {
  console.log(chalk.yellow(`🔧 Fixing ${fix.file}...`));
  try {
    let content = await fs.readFile(fix.file, 'utf-8');
    if (!content.includes(fix.fix.trim().substring(0, 50))) {
      // Add fix at appropriate location
      content += '\n' + fix.fix;
      await fs.writeFile(fix.file, content);
      console.log(chalk.green(`  ✅ Applied fix to ${fix.file}`));
    }
  } catch (err) {
    console.log(chalk.red(`  ❌ Failed: ${err.message}`));
  }
}
