/**
 * ═══════════════════════════════════════════════════════════════
 * Platform Detector - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * Auto-detects platform: Termux (default), Linux, Windows, macOS, Android
 * Provides platform-specific adaptations for maximum compatibility
 * ═══════════════════════════════════════════════════════════════
 */

import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { PlatformInfo, PlatformType } from '@codex-types/index';

export class PlatformDetector {
  private static instance: PlatformDetector;
  private cachedInfo?: PlatformInfo;

  static getInstance(): PlatformDetector {
    if (!PlatformDetector.instance) {
      PlatformDetector.instance = new PlatformDetector();
    }
    return PlatformDetector.instance;
  }

  /**
   * Detect the current platform with comprehensive checks
   */
  async detect(): Promise<PlatformInfo> {
    if (this.cachedInfo) return this.cachedInfo;

    const platform = process.platform;
    const env = process.env;

    // Check for Termux (default priority)
    const isTermux = await this.checkTermux();
    const isAndroid = isTermux || platform === 'android' || env.ANDROID_ROOT !== undefined;

    const detectedType: PlatformType = isTermux ? 'termux' 
      : isAndroid ? 'android'
      : platform === 'win32' ? 'win32'
      : platform === 'darwin' ? 'darwin'
      : platform === 'linux' ? 'linux'
      : 'unknown';

    const isWindows = platform === 'win32';
    const isLinux = platform === 'linux' && !isTermux;
    const isMac = platform === 'darwin';
    const isMobile = isAndroid || isTermux;

    const shell = this.detectShell(detectedType);
    const homeDir = this.getHomeDir(detectedType);
    const tempDir = this.getTempDir(detectedType);

    // Platform-specific capabilities
    const supportsGUI = !isMobile && !isTermux;
    // Puppeteer doesn't work on Termux/Android and has issues on Windows without WSL
    const supportsPuppeteer = !isMobile && !isTermux && (isWindows ? false : true);
    const maxConcurrency = isMobile ? 2 : os.cpus().length;

    this.cachedInfo = {
      type: detectedType,
      isTermux,
      isMobile,
      isWindows,
      isLinux,
      isMac,
      shell,
      homeDir,
      tempDir,
      nodeVersion: process.version,
      supportsGUI,
      supportsPuppeteer,
      maxConcurrency,
    };

    return this.cachedInfo;
  }

  /**
   * Check if running in Termux environment
   */
  private async checkTermux(): Promise<boolean> {
    // Multiple detection methods for reliability
    if (process.env.TERMUX_VERSION) return true;
    if (process.env.PREFIX?.includes('termux')) return true;
    if (process.env.HOME?.includes('termux')) return true;
    
    // Check for termux-specific paths
    try {
      await fs.access('/data/data/com.termux/files/usr/bin/termux-info');
      return true;
    } catch { /* not termux */ }

    try {
      await fs.access('/data/data/com.termux/files/usr');
      return true;
    } catch { /* not termux */ }

    return false;
  }

  /**
   * Detect the appropriate shell for the platform
   */
  private detectShell(platform: PlatformType): string {
    if (process.env.SHELL) return process.env.SHELL;
    
    switch (platform) {
      case 'termux': return '/data/data/com.termux/files/usr/bin/bash';
      case 'android': return '/system/bin/sh';
      case 'win32': return process.env.COMSPEC || 'cmd.exe';
      case 'darwin': return '/bin/zsh';
      case 'linux': return '/bin/bash';
      default: return '/bin/sh';
    }
  }

  /**
   * Get the home directory for the platform
   */
  private getHomeDir(platform: PlatformType): string {
    if (process.env.HOME) return process.env.HOME;
    if (process.env.USERPROFILE) return process.env.USERPROFILE;
    
    switch (platform) {
      case 'termux': return '/data/data/com.termux/files/home';
      case 'android': return '/sdcard';
      case 'win32': return 'C:\\Users\\' + process.env.USERNAME;
      default: return '/tmp';
    }
  }

  /**
   * Get the temp directory for the platform
   */
  private getTempDir(platform: PlatformType): string {
    if (process.env.TMPDIR) return process.env.TMPDIR;
    if (process.env.TEMP) return process.env.TEMP;
    if (process.env.TMP) return process.env.TMP;
    
    switch (platform) {
      case 'termux': return '/data/data/com.termux/files/usr/tmp';
      case 'android': return '/data/local/tmp';
      case 'win32': return 'C:\\Windows\\Temp';
      case 'darwin': return '/tmp';
      default: return '/tmp';
    }
  }

  /**
   * Get platform-specific command adaptations
   */
  getCommandAdaptations(info: PlatformInfo): {
    pathSeparator: string;
    lineEnding: string;
    shebang: string;
    nodePath: string;
    npmPath: string;
    pythonPath: string;
  } {
    const isWindows = info.isWindows;
    return {
      pathSeparator: isWindows ? '\\' : '/',
      lineEnding: isWindows ? '\r\n' : '\n',
      shebang: isWindows ? '#!node' : '#!/usr/bin/env node',
      nodePath: isWindows ? 'node.exe' : 'node',
      npmPath: isWindows ? 'npm.cmd' : 'npm',
      pythonPath: isWindows ? 'python.exe' : 'python3',
    };
  }

  /**
   * Get platform-specific installation instructions
   */
  getInstallInstructions(info: PlatformInfo): string {
    switch (info.type) {
      case 'termux':
        return `Termux Installation:
  pkg update && pkg upgrade
  pkg install nodejs git
  npm install -g cod3x-code
  cod3x init`;
      case 'android':
        return `Android Installation:
  Install Termux from F-Droid
  Then follow Termux installation instructions`;
      case 'win32':
        return `Windows Installation:
  # Using PowerShell (Admin)
  npm install -g cod3x-code
  cod3x init
  
  # Or using Chocolatey
  choco install cod3x-code`;
      case 'darwin':
        return `macOS Installation:
  # Using Homebrew
  brew install cod3x-code
  
  # Or using npm
  npm install -g cod3x-code
  cod3x init`;
      case 'linux':
        return `Linux Installation:
  # Using npm
  npm install -g cod3x-code
  cod3x init
  
  # Or using snap
  snap install cod3x-code`;
      default:
        return `Generic Installation:
  npm install -g cod3x-code
  cod3x init`;
    }
  }

  /**
   * Apply platform-specific environment adjustments
   */
  applyEnvironment(info: PlatformInfo): void {
    // Ensure PATH includes common binary locations
    const paths: string[] = [];
    
    if (info.isTermux) {
      paths.push('/data/data/com.termux/files/usr/bin');
      paths.push('/data/data/com.termux/files/usr/local/bin');
    }
    
    if (info.isLinux || info.isMac) {
      paths.push('/usr/local/bin', '/usr/bin', '/bin');
      paths.push(path.join(info.homeDir, '.local', 'bin'));
      paths.push(path.join(info.homeDir, 'node_modules', '.bin'));
    }

    if (paths.length > 0) {
      const currentPath = process.env.PATH || '';
      const newPaths = paths.filter(p => !currentPath.includes(p));
      if (newPaths.length > 0) {
        process.env.PATH = [...newPaths, currentPath].join(path.delimiter);
      }
    }

    // Platform-specific optimizations
    if (info.isMobile || info.isTermux) {
      process.env.NODE_OPTIONS = '--max-old-space-size=512';
    }
  }
}

export default PlatformDetector;
