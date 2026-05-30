#!/usr/bin/env node
import { createInterface } from 'readline';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

async function debug() {
  console.log('🔍 Debugging config loading...\n');
  
  // Load config
  const configPath = './.cod3xrc';
  const configContent = await fs.readFile(configPath, 'utf-8');
  const config = JSON.parse(configContent);
  
  console.log('Config loaded successfully');
  console.log('Config keys:', Object.keys(config));
  console.log('Context keys:', Object.keys(config.context));
  console.log('includePatterns exists?', !!config.context.includePatterns);
  console.log('excludePatterns exists?', !!config.context.excludePatterns);
  console.log('include exists?', !!config.context.include);
  console.log('exclude exists?', !!config.context.exclude);
  console.log('');
  
  // Now check cod3x.js line 169-170 expectation
  console.log('What cod3x.js expects:');
  console.log('  - config.context.include (this is what it tries to iterate)');
  console.log('  - config.context.exclude');
  console.log('');
  
  console.log('What your config provides:');
  console.log('  - config.context.includePatterns ✓');
  console.log('  - config.context.excludePatterns ✓');
  console.log('');
  
  console.log('❌ The problem: cod3x.js looks for "include" but your config has "includePatterns"');
  console.log('');
  console.log('✅ Solutions:');
  console.log('   1. Change cod3x.js line 169-170 to use includePatterns');
  console.log('   2. Or add "include" and "exclude" to your .cod3xrc');
}

debug();
