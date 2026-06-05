#!/usr/bin/env node
/**
 * Post-install script for Cod3x Code v4.0
 * Developed by CodexHaven
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function postinstall() {
  try {
    const cod3xDir = path.join(os.homedir(), '.cod3x');
    await fs.mkdir(cod3xDir, { recursive: true });
    await fs.mkdir(path.join(cod3xDir, 'hooks'), { recursive: true });
    await fs.mkdir(path.join(cod3xDir, 'cache'), { recursive: true });
    await fs.mkdir(path.join(cod3xDir, 'memory'), { recursive: true });
    await fs.mkdir(path.join(cod3xDir, 'trails'), { recursive: true });
    await fs.mkdir(path.join(cod3xDir, 'agents'), { recursive: true });

    // Create default config if not exists
    const configPath = path.join(os.homedir(), '.cod3xrc');
    try {
      await fs.access(configPath);
    } catch {
      const config = {
        name: 'default-environment',
        version: '1.0.0',
        platform: { type: 'termux', autoDetect: true },
        ai: { provider: 'opencode-proxy', model: 'claude-sonnet-4' },
        features: { swarmAgents: true, browser: true, debugTrail: true },
        by: 'CodexHaven Cod3x Code v4.0',
      };
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    }

    console.log('Cod3x Code v4.0 by CodexHaven - Setup complete!');
    console.log('Run: cod3x init  (to initialize a project)');
    console.log('Run: cod3x       (to start)');
  } catch (error) {
    // Silent failure - not critical
  }
}

postinstall();
