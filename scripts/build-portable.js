#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * Cod3x Code v4.0 - Portable Build Script
 * Developed by CodexHaven
 *
 * Creates a ready-to-distribute portable package that:
 * - Includes launchers, tools, dashboard, and compiled code
 * - Creates empty data/ and engine/ folders for runtime
 * - Generates README with setup instructions
 * - Creates a ZIP archive of the complete package
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const VERSION = require(path.join(ROOT, 'package.json')).version;
const RELEASE_DIR = path.join(ROOT, `cod3x-portable-v${VERSION}`);
const RELEASE_ZIP = path.join(ROOT, `cod3x-portable-v${VERSION}.zip`);

function log(message) {
  console.log(`[build-portable] ${message}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function main() {
  log('══════════════════════════════════════════════════');
  log('  Cod3x Portable Build Script v' + VERSION);
  log('══════════════════════════════════════════════════');
  log('');

  // ─── Step 1: Clean old releases ───
  log('Step 1: Cleaning old release directories...');
  cleanDir(RELEASE_DIR);
  if (fs.existsSync(RELEASE_ZIP)) {
    fs.unlinkSync(RELEASE_ZIP);
  }

  // ─── Step 2: Run build ───
  log('Step 2: Running TypeScript build...');
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  } catch (error) {
    log('Build failed. Fix errors and try again.');
    process.exit(1);
  }

  // ─── Step 3: Create release directory structure ───
  log('Step 3: Creating release directory structure...');
  ensureDir(RELEASE_DIR);

  // Copy launchers/
  log('  - Copying launchers/');
  copyDir(path.join(ROOT, 'launchers'), path.join(RELEASE_DIR, 'launchers'));

  // Copy tools/
  log('  - Copying tools/');
  copyDir(path.join(ROOT, 'tools'), path.join(RELEASE_DIR, 'tools'));

  // Copy dist/
  log('  - Copying dist/');
  copyDir(path.join(ROOT, 'dist'), path.join(RELEASE_DIR, 'dist'));

  // Copy server files
  log('  - Copying server files');
  fs.copyFileSync(path.join(ROOT, 'server.mjs'), path.join(RELEASE_DIR, 'server.mjs'));
  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(RELEASE_DIR, 'index.html'));
  fs.copyFileSync(path.join(ROOT, 'register-paths.mjs'), path.join(RELEASE_DIR, 'register-paths.mjs'));
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(RELEASE_DIR, 'package.json'));

  // ─── Step 4: Create empty runtime directories ───
  log('Step 4: Creating empty runtime directories...');
  ensureDir(path.join(RELEASE_DIR, 'data', 'config'));
  ensureDir(path.join(RELEASE_DIR, 'data', 'memory'));
  ensureDir(path.join(RELEASE_DIR, 'data', 'logs'));
  ensureDir(path.join(RELEASE_DIR, 'data', 'tmp'));
  ensureDir(path.join(RELEASE_DIR, 'data', 'ollama'));
  ensureDir(path.join(RELEASE_DIR, 'engine'));

  // Add .gitkeep to preserve empty dirs in ZIP
  fs.writeFileSync(path.join(RELEASE_DIR, 'data', '.gitkeep'), '# Runtime data directory\n');
  fs.writeFileSync(path.join(RELEASE_DIR, 'engine', '.gitkeep'), '# Runtime engine directory\n');

  // ─── Step 5: Create README ───
  log('Step 5: Creating README...');
  const readme = `# Cod3x Code v${VERSION} - Portable Edition

Developed by [CodexHaven](https://github.com/codexhaven)

The Open-Source Claude Code Alternative - AI coding assistant that runs from a USB drive.

## Quick Start

### Windows
1. Extract this ZIP file
2. Double-click \`launchers/START.bat\`
3. Node.js will auto-download on first run (no installation needed)

### Linux / macOS
1. Extract this ZIP file
2. Open a terminal in the extracted folder
3. Run: \`bash launchers/start.sh\`
4. Requires \`curl\` (pre-installed on most systems)

### Menu Options
1. **Normal Mode** - Asks before destructive operations (default)
2. **Limitless Mode** - Auto-executes, no prompts (use with caution)
3. **Web Dashboard** - Opens http://localhost:9000 in browser
4. **Change Provider** - Switch between AI providers (OpenAI, Claude, Ollama, etc.)
5. **Setup Offline** - Configure local Ollama models
6. **Resume Session** - Resume a previous chat session

## Switching Computers

Just copy the entire folder to a new computer. **All your data travels with it:**
- \`data/config/\` - AI settings and preferences
- \`data/memory/\` - Chat history and sessions
- \`data/logs/\` - Activity logs
- \`data/ollama/\` - Downloaded local models (optional)

**Nothing is left on the host computer.**

## Security

- All data stays in \`./data/\` - nothing touches the host system
- No admin/root privileges required
- Portable mode safety: dangerous tools (bash, write, delete) require explicit approval
- Set \`COD3X_LIMITLESS=1\` to bypass confirmations (not recommended on public computers)

## Offline Mode

1. Install [Ollama](https://ollama.com) on your computer
2. Run option 5 from the menu to download models
3. The local speed proxy automatically trims oversized prompts for faster inference

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Node.js not found" | Run the launcher script first (it auto-downloads Node) |
| "npm install failed" | Check internet connection on first run |
| "Port 9000 in use" | Dashboard already running, or change port in server.mjs |
| "Slow Ollama responses" | Use a smaller model (gemma3:1b) or faster hardware |
| "No LLM providers" | Run option 4 to configure an AI provider with API key |
| "Permission denied" | On Linux/macOS, run: \`chmod +x launchers/*.sh\` |

## File Structure

\`\`\`
cod3x-portable-v${VERSION}/
├── launchers/
│   ├── START.bat          # Windows launcher
│   ├── start.sh           # Linux/macOS launcher
│   ├── RESUME.bat         # Windows session resume
│   └── resume.sh          # Linux/macOS session resume
├── tools/
│   ├── change-provider.js # AI provider switcher
│   ├── local-proxy.js     # Ollama speed proxy
│   ├── setup-local-models.bat
│   └── setup-local-models.sh
├── data/                  # Your data (created at runtime)
│   ├── config/
│   ├── memory/
│   ├── logs/
│   ├── tmp/
│   └── ollama/
├── engine/                # Node.js runtime (auto-downloaded)
│   ├── node-<platform>/
│   └── node_modules/
├── dist/                  # Compiled TypeScript
├── server.mjs             # Web dashboard server
├── index.html             # Dashboard UI
└── package.json
\`\`\`

## Links

- Website: https://github.com/codexhaven/cod3x-code
- Issues: https://github.com/codexhaven/cod3x-code/issues
- Documentation: https://github.com/codexhaven/cod3x-code#readme

---

**License:** MIT | **Author:** CodexHaven <dev@codexhaven.com>
`;

  fs.writeFileSync(path.join(RELEASE_DIR, 'README-PORTABLE.md'), readme);

  // ─── Step 6: Create ZIP ───
  log('Step 6: Creating ZIP archive...');
  try {
    if (process.platform === 'win32') {
      // Windows: use PowerShell
      execSync(
        `powershell -Command "Compress-Archive -Path '${RELEASE_DIR}/*' -DestinationPath '${RELEASE_ZIP}' -Force"`,
        { cwd: ROOT }
      );
    } else {
      // Linux/macOS: use zip command
      const dirName = path.basename(RELEASE_DIR);
      execSync(`zip -r "${RELEASE_ZIP}" "${dirName}"`, { cwd: ROOT });
    }
    log(`ZIP created: ${path.basename(RELEASE_ZIP)}`);
  } catch (error) {
    log('ZIP creation failed. The release folder is still available.');
    log(`Release folder: ${RELEASE_DIR}`);
  }

  // ─── Done ───
  log('');
  log('══════════════════════════════════════════════════');
  log('  Build Complete!');
  log('══════════════════════════════════════════════════');
  log(`  Release folder: ${path.relative(ROOT, RELEASE_DIR)}`);
  log(`  ZIP archive:    ${path.relative(ROOT, RELEASE_ZIP)}`);
  log(`  Version:        ${VERSION}`);
  log('');
  log('  Distribute the ZIP file or the release folder.');
  log('  Users just extract and double-click START.bat or run ./start.sh');
  log('══════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('[build-portable] Error:', err);
  process.exit(1);
});
