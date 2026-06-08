/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Configuration Loader - Cod3x Code v4.0
 * Developed by CodexHaven
 *
 * Three-level config with platform auto-detection and portable mode
 * Global -> Local -> Project hierarchy with environment overrides
 * Portable mode: all data stays in ./data/ relative to executable
 * ═══════════════════════════════════════════════════════════════
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { Config, PlatformType } from '@codex-types/index';
import { defaultConfig } from './defaults';
import { PlatformDetector } from '@platform/detector';

const CONFIG_FILE_NAME = '.cod3xrc';
const CONFIG_DIR = '.cod3x';

export class ConfigLoader {
  private config: Config;
  private loadedPaths: string[] = [];
  private platformDetector: PlatformDetector;
  private configHome: string = path.join(os.homedir(), CONFIG_DIR);
  private dataHome: string = path.join(os.homedir(), CONFIG_DIR);
  private portableRoot: string | null = null;

  constructor() {
    this.config = this.deepClone(defaultConfig);
    this.platformDetector = PlatformDetector.getInstance();
  }

  /**
   * Detect portable mode by checking for data/ directory sibling to executable
   */
  private getPortableRoot(): string | null {
    // Already detected
    if (this.portableRoot) return this.portableRoot;

    // Check explicit env var
    if (process.env.COD3X_PORTABLE_ROOT) {
      this.portableRoot = process.env.COD3X_PORTABLE_ROOT;
      return this.portableRoot;
    }

    // Check if data/ directory exists as sibling to executable
    try {
      const exeDir = path.dirname(process.argv[1] || process.execPath);
      const possibleData = path.resolve(exeDir, '..', 'data');
      if (fsSync.existsSync(possibleData)) {
        this.portableRoot = path.resolve(exeDir, '..');
        return this.portableRoot;
      }

      // Also check cwd (for development/testing)
      const cwdData = path.resolve(process.cwd(), 'data');
      if (fsSync.existsSync(cwdData)) {
        this.portableRoot = process.cwd();
        return this.portableRoot;
      }
    } catch {
      // Standard mode
    }

    return null;
  }

  /**
   * Check if running in portable mode
   */
  isPortable(): boolean {
    return this.getPortableRoot() !== null;
  }

  /**
   * Load configuration from all levels with platform detection
   */
  async load(cwd: string = process.cwd()): Promise<Config> {
    this.loadedPaths = [];

    // Detect portable mode first
    const portableRoot = this.getPortableRoot();

    if (portableRoot) {
      // Portable mode: use ./data/ paths
      this.configHome = path.join(portableRoot, 'data', 'config');
      this.dataHome = path.join(portableRoot, 'data');

      // Ensure directories exist
      await fs.mkdir(this.configHome, { recursive: true });
      await fs.mkdir(path.join(this.dataHome, 'memory'), { recursive: true });
      await fs.mkdir(path.join(this.dataHome, 'logs'), { recursive: true });
      await fs.mkdir(path.join(this.dataHome, 'tmp'), { recursive: true });
    } else {
      // Standard mode: use home directory
      this.configHome = os.homedir();
      this.dataHome = path.join(os.homedir(), CONFIG_DIR);
    }

    // Detect platform
    const platformInfo = await this.platformDetector.detect();
    this.config.platform.type = platformInfo.type;
    this.config.platform.shell = platformInfo.shell;
    this.config.platform.maxConcurrency = platformInfo.maxConcurrency;

    // Level 1: Global config
    await this.loadLevel(path.join(this.configHome, CONFIG_FILE_NAME));

    // Level 2: Local config (machine-specific, not in git)
    await this.loadLevel(path.join(this.dataHome, 'config.local.json'));

    // Level 3: Project config
    await this.loadLevel(path.join(cwd, CONFIG_FILE_NAME));

    // Environment variable overrides
    this.applyEnvironmentOverrides();

    // Platform-specific adjustments
    this.applyPlatformDefaults(platformInfo.type);

    return this.config;
  }

  /**
   * Load configuration from a single file
   */
  private async loadLevel(configPath: string): Promise<void> {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      this.mergeConfig(parsed);
      this.loadedPaths.push(configPath);
    } catch {
      // File doesn't exist or is invalid, skip
    }
  }

  /**
   * Apply platform-specific defaults
   */
  private applyPlatformDefaults(platform: PlatformType): void {
    switch (platform) {
      case 'termux':
        this.config.ai.opencodeProxyURL = process.env.OPENCODE_PROXY_URL || 'http://localhost:8000/v1';
        this.config.browser.enabled = false;
        this.config.features.browser = false;
        this.config.platform.adaptForMobile = true;
        this.config.limits.maxFileSize = 5242880; // 5MB on mobile
        break;
      case 'android':
        this.config.browser.enabled = false;
        this.config.features.browser = false;
        this.config.platform.adaptForMobile = true;
        break;
      case 'win32':
        this.config.permissions.shell = 'cmd.exe';
        this.config.features.gitWorkflow = true;
        break;
      case 'darwin':
        this.config.platform.shell = '/bin/zsh';
        break;
      case 'linux':
        this.config.platform.shell = '/bin/bash';
        break;
    }
  }

  /**
   * Apply environment variable overrides
   */
  private applyEnvironmentOverrides(): void {
    const env = process.env;

    // AI configuration
    if (env.COD3X_PROVIDER) this.config.ai.provider = env.COD3X_PROVIDER as any;
    if (env.COD3X_MODEL) this.config.ai.model = env.COD3X_MODEL;
    if (env.COD3X_TEMPERATURE) this.config.ai.temperature = parseFloat(env.COD3X_TEMPERATURE);
    if (env.COD3X_MAX_TOKENS) this.config.ai.maxTokens = parseInt(env.COD3X_MAX_TOKENS, 10);
    if (env.COD3X_CUSTOM_BASE_URL) this.config.ai.customBaseURL = env.COD3X_CUSTOM_BASE_URL;
    if (env.COD3X_CUSTOM_API_KEY) this.config.ai.customApiKey = env.COD3X_CUSTOM_API_KEY;
    if (env.OPENCODE_PROXY_URL) this.config.ai.opencodeProxyURL = env.OPENCODE_PROXY_URL;

    // Permissions
    if (env.COD3X_ASK_BEFORE_BASH !== undefined) this.config.permissions.askBeforeBash = env.COD3X_ASK_BEFORE_BASH === 'true';
    if (env.COD3X_ASK_BEFORE_WRITE !== undefined) this.config.permissions.askBeforeWrite = env.COD3X_ASK_BEFORE_WRITE === 'true';
    if (env.COD3X_ASK_BEFORE_DELETE !== undefined) this.config.permissions.askBeforeDelete = env.COD3X_ASK_BEFORE_DELETE === 'true';
    if (env.COD3X_ASK_BEFORE_NETWORK !== undefined) this.config.permissions.askBeforeNetwork = env.COD3X_ASK_BEFORE_NETWORK === 'true';

    // Platform override
    if (env.PLATFORM) {
      this.config.platform.type = env.PLATFORM as PlatformType;
      this.config.platform.autoDetect = false;
    }

    // Feature toggles
    if (env.COD3X_SWARM_ENABLED !== undefined) this.config.swarm.enabled = env.COD3X_SWARM_ENABLED === 'true';
    if (env.COD3X_SWARM_MAX_CONCURRENT) this.config.swarm.maxConcurrent = parseInt(env.COD3X_SWARM_MAX_CONCURRENT, 10);
    if (env.COD3X_BROWSER_ENABLED !== undefined) this.config.browser.enabled = env.COD3X_BROWSER_ENABLED === 'true';
    if (env.COD3X_DEBUG_TRAIL !== undefined) this.config.debug.trailEnabled = env.COD3X_DEBUG_TRAIL === 'true';
    if (env.COD3X_MCP_ENABLED !== undefined) this.config.mcp.enabled = env.COD3X_MCP_ENABLED === 'true';
    if (env.COD3X_TELEMETRY !== undefined) this.config.features.telemetry = env.COD3X_TELEMETRY === 'true';
  }

  /**
   * Deep merge partial config into current config
   */
  private mergeConfig(partial: Partial<Config>): void {
    this.config = this.deepMerge(this.config, partial);
  }

  /**
   * Save current configuration
   * - In portable mode: saves to data/config/
   * - In standard mode: saves to cwd
   */
  async save(cwd: string = process.cwd()): Promise<void> {
    const portableRoot = this.getPortableRoot();
    let configPath: string;

    if (portableRoot) {
      // Portable mode: always save to data/config/
      configPath = path.join(portableRoot, 'data', 'config', CONFIG_FILE_NAME);
    } else {
      // Standard mode: save to project level
      configPath = path.join(cwd, CONFIG_FILE_NAME);
    }

    await fs.writeFile(configPath, JSON.stringify(this.config, null, 2), 'utf-8');
  }

  /**
   * Get the current configuration
   */
  get(): Config {
    return this.config;
  }

  /**
   * Get list of loaded config paths
   */
  getLoadedPaths(): string[] {
    return this.loadedPaths;
  }

  /**
   * Initialize default configuration
   * - In portable mode: creates data/config/, data/memory/, data/logs/, data/tmp/
   * - In standard mode: creates .cod3x/ directory in cwd
   */
  async init(cwd: string = process.cwd()): Promise<void> {
    const portableRoot = this.getPortableRoot();

    if (portableRoot) {
      // Portable mode init
      const configDir = path.join(portableRoot, 'data', 'config');
      const configPath = path.join(configDir, CONFIG_FILE_NAME);

      try {
        await fs.access(configPath);
        console.log('⚠️  Cod3x is already initialized. Use --force to overwrite.');
        return;
      } catch {
        // Not initialized, continue
      }

      const platformInfo = await this.platformDetector.detect();
      const projectConfig = {
        name: path.basename(cwd),
        version: '1.0.0',
        platform: {
          type: platformInfo.type,
          autoDetect: true,
        },
        ai: {
          provider: 'opencode-proxy',
          model: 'claude-sonnet-4',
        },
        created: new Date().toISOString(),
        by: 'CodexHaven Cod3x Code v4.0',
      };

      await fs.writeFile(configPath, JSON.stringify(projectConfig, null, 2), 'utf-8');

      // Create portable data directories
      const dataDir = path.join(portableRoot, 'data');
      await fs.mkdir(path.join(dataDir, 'memory'), { recursive: true });
      await fs.mkdir(path.join(dataDir, 'logs'), { recursive: true });
      await fs.mkdir(path.join(dataDir, 'tmp'), { recursive: true });
      await fs.mkdir(path.join(dataDir, 'ollama'), { recursive: true });

      console.log('✓ Created portable configuration in data/config/.cod3xrc');
      console.log('✓ Created data/ directory structure');
      console.log('\n✨ Cod3x by CodexHaven initialized successfully (portable mode)!\n');
      console.log('All data stays in: ' + dataDir);
      console.log('\nNext steps:');
      console.log('  1. Run cod3x to start the interactive session');
      console.log('  2. Edit data/config/.cod3xrc to customize behavior');
      console.log('  3. Install opencode-free-proxy for free AI access');
      console.log('     -> https://github.com/sionex-code/opencode-proxy-api');
      return;
    }

    // Standard mode init
    const configPath = path.join(cwd, CONFIG_FILE_NAME);

    try {
      await fs.access(configPath);
      console.log('⚠️  Cod3x is already initialized. Use --force to overwrite.');
      return;
    } catch {
      // Not initialized, continue
    }

    const platformInfo = await this.platformDetector.detect();
    const projectConfig = {
      name: path.basename(cwd),
      version: '1.0.0',
      platform: {
        type: platformInfo.type,
        autoDetect: true,
      },
      ai: {
        provider: 'opencode-proxy',
        model: 'claude-sonnet-4',
      },
      created: new Date().toISOString(),
      by: 'CodexHaven Cod3x Code v4.0',
    };

    await fs.writeFile(configPath, JSON.stringify(projectConfig, null, 2), 'utf-8');

    // Create .cod3x directory structure
    const cod3xDir = path.join(cwd, '.cod3x');
    await fs.mkdir(cod3xDir, { recursive: true });
    await fs.mkdir(path.join(cod3xDir, 'hooks'), { recursive: true });
    await fs.mkdir(path.join(cod3xDir, 'cache'), { recursive: true });
    await fs.mkdir(path.join(cod3xDir, 'memory'), { recursive: true });
    await fs.mkdir(path.join(cod3xDir, 'trails'), { recursive: true });
    await fs.mkdir(path.join(cod3xDir, 'agents'), { recursive: true });

    // Create .gitignore entry
    const gitignorePath = path.join(cwd, '.gitignore');
    try {
      const gitignore = await fs.readFile(gitignorePath, 'utf-8');
      if (!gitignore.includes('.cod3x/')) {
        await fs.appendFile(gitignorePath, '\n# Cod3x by CodexHaven\n.cod3x/\nlogs/\n*.cod3x.log\n.cod3x-memory.json\n');
      }
    } catch {
      await fs.writeFile(gitignorePath, '# Cod3x by CodexHaven\n.cod3x/\nlogs/\n*.cod3x.log\n.cod3x-memory.json\n', 'utf-8');
    }

    console.log('✓ Created .cod3xrc configuration');
    console.log('✓ Created .cod3x/ directory structure');
    console.log('✓ Updated .gitignore');
    console.log('\n✨ Cod3x by CodexHaven initialized successfully!\n');
    console.log('Next steps:');
    console.log('  1. Run `cod3x` to start the interactive session');
    console.log('  2. Edit .cod3xrc to customize behavior');
    console.log('  3. Install opencode-free-proxy for free AI access');
    console.log('     -> https://github.com/sionex-code/opencode-proxy-api');
  }

  private deepMerge(target: any, source: any): any {
    if (!source || typeof source !== 'object') return target;
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else if (source[key] !== undefined) {
        result[key] = source[key];
      }
    }
    return result;
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}

export default ConfigLoader;
