import fs from 'fs/promises';
import path from 'path';

export async function execute(args = []) {
  console.log('📦 Initializing Cod3x in current directory...\n');
  
  const configPath = path.join(process.cwd(), '.cod3xrc');
  
  // Check if already initialized
  try {
    await fs.access(configPath);
    console.log('⚠️ Cod3x is already initialized. Use --force to overwrite.');
    return;
  } catch (error) {
    // Not initialized, continue
  }
  
  const defaultConfig = {
    name: path.basename(process.cwd()),
    version: '1.0.0',
    created: new Date().toISOString(),
    
    permissions: {
      askBeforeBash: true,
      askBeforeWrite: true,
      askBeforeDelete: true,
      blockedCommands: ['rm -rf /', 'sudo', 'mkfs', 'dd if=', ':(){', 'del /f', 'format']
    },
    
    context: {
      maxFiles: 100,
      includePatterns: [
        '**/*.{js,ts,jsx,tsx,py,go,rs,java,kt,md,json,yaml,yml}',
        '**/*.{css,scss,html,xml,svg}',
        '**/package.json',
        '**/requirements.txt',
        '**/go.mod',
        '**/Cargo.toml'
      ],
      excludePatterns: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        '__pycache__/**',
        'target/**',
        '*.log',
        '.env'
      ]
    },
    
    ai: {
      provider: 'openrouter',
      model: 'claude-3.5-sonnet',
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: 'You are Cod3x, a thoughtful AI coding assistant...'
    },
    
    mcp: {
      enabled: false,
      port: 8765,
      autoStart: false,
      tools: ['read_file', 'write_file', 'execute_command']
    },
    
    hooks: {
      preTool: true,
      postTool: true,
      customHooksPath: './.cod3x/hooks'
    },
    
    ide: {
      enabled: true,
      vscode: true,
      autoOpenFiles: true
    },
    
    logging: {
      level: 'info',
      file: './logs/cod3x.log',
      maxSize: '10MB'
    },
    
    features: {
      autoCompact: true,
      suggestImprovements: true,
      trackUsage: false,
      telemetry: false
    }
  };
  
  await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
  
  // Create .cod3x directory
  const cod3xDir = path.join(process.cwd(), '.cod3x');
  await fs.mkdir(cod3xDir, { recursive: true });
  
  // Create subdirectories
  await fs.mkdir(path.join(cod3xDir, 'hooks'), { recursive: true });
  await fs.mkdir(path.join(cod3xDir, 'cache'), { recursive: true });
  
  // Create .gitignore entry
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  try {
    const gitignore = await fs.readFile(gitignorePath, 'utf-8');
    if (!gitignore.includes('.cod3x/')) {
      await fs.appendFile(gitignorePath, '\n.cod3x/\n');
    }
  } catch (error) {
    // Create .gitignore
    await fs.writeFile(gitignorePath, '.cod3x/\nlogs/\n');
  }
  
  console.log('✓ Created .cod3xrc configuration');
  console.log('✓ Created .cod3x/ directory');
  console.log('✓ Updated .gitignore');
  console.log('\n✨ Cod3x initialized successfully!\n');
  console.log('Next steps:');
  console.log('  1. Run `cod3x` to start the interactive session');
  console.log('  2. Edit .cod3xrc to customize behavior');
  console.log('  3. Set OPENROUTER_API_KEY for AI features');
}

export default { execute };
