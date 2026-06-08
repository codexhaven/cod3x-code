#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * Cod3x Code v4.0 - AI Provider Switcher Wizard
 * Developed by CodexHaven
 *
 * Interactive CLI to switch between AI providers and configure
 * API keys. Works in both interactive and non-interactive modes.
 * ═══════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt, hidden = false) {
  return new Promise((resolve) => {
    if (hidden) {
      const stdin = process.stdin;
      const stdout = process.stdout;
      stdout.write(prompt);
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      let input = '';
      stdin.on('data', (ch) => {
        const char = ch.toString();
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            stdin.setRawMode(false);
            stdin.pause();
            stdout.write('\n');
            resolve(input);
            break;
          case '\u0003':
            process.exit();
            break;
          case '\u007f':
          case '\u0008':
            if (input.length > 0) {
              input = input.slice(0, -1);
              stdout.write('\b \b');
            }
            break;
          default:
            input += char;
            stdout.write('*');
            break;
        }
      });
    } else {
      rl.question(prompt, resolve);
    }
  });
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Cod3x Code v4.0 - AI Provider Switcher');
  console.log('  Developed by CodexHaven');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Determine config directory
  const configHome = process.env.COD3X_HOME || path.join(require('os').homedir(), '.cod3x');
  const configDir = path.join(configHome, 'config');
  const envFile = path.join(configDir, 'ai_settings.env');

  // Ensure config directory exists
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // ─── Provider Menu ───
  console.log('Select an AI provider:\n');
  console.log('  [1] NVIDIA NIM');
  console.log('  [2] Anthropic Claude');
  console.log('  [3] OpenAI');
  console.log('  [4] OpenRouter');
  console.log('  [5] Google Gemini');
  console.log('  [6] Ollama (Offline / Local)');
  console.log('  [7] LM Studio');
  console.log('  [8] Custom OpenAI-compatible API');
  console.log('');

  const choice = await question('Enter choice (1-8): ');

  let provider, apiKey, baseUrl, model;

  switch (choice.trim()) {
    case '1': // NVIDIA NIM
      provider = 'openai'; // NVIDIA NIM uses OpenAI-compatible API
      console.log('\n--- NVIDIA NIM Configuration ---');
      apiKey = await question('API Key (nvapi-...): ', true);
      baseUrl = await question('Base URL [https://integrate.api.nvidia.com/v1]: ');
      if (!baseUrl.trim()) baseUrl = 'https://integrate.api.nvidia.com/v1';
      model = await question('Model [nvidia/llama-3.1-nemotron-70b-instruct]: ');
      if (!model.trim()) model = 'nvidia/llama-3.1-nemotron-70b-instruct';
      break;

    case '2': // Anthropic Claude
      provider = 'anthropic';
      console.log('\n--- Anthropic Claude Configuration ---');
      apiKey = await question('API Key (sk-ant-...): ', true);
      baseUrl = await question('Base URL [https://api.anthropic.com/v1]: ');
      if (!baseUrl.trim()) baseUrl = 'https://api.anthropic.com/v1';
      model = await question('Model [claude-sonnet-4-20250514]: ');
      if (!model.trim()) model = 'claude-sonnet-4-20250514';
      break;

    case '3': // OpenAI
      provider = 'openai';
      console.log('\n--- OpenAI Configuration ---');
      apiKey = await question('API Key (sk-...): ', true);
      baseUrl = await question('Base URL [https://api.openai.com/v1]: ');
      if (!baseUrl.trim()) baseUrl = 'https://api.openai.com/v1';
      model = await question('Model [gpt-4o]: ');
      if (!model.trim()) model = 'gpt-4o';
      break;

    case '4': // OpenRouter
      provider = 'openrouter';
      console.log('\n--- OpenRouter Configuration ---');
      apiKey = await question('API Key (sk-or-...): ', true);
      baseUrl = await question('Base URL [https://openrouter.ai/api/v1]: ');
      if (!baseUrl.trim()) baseUrl = 'https://openrouter.ai/api/v1';
      model = await question('Model [anthropic/claude-sonnet-4]: ');
      if (!model.trim()) model = 'anthropic/claude-sonnet-4';
      break;

    case '5': // Google Gemini
      provider = 'google';
      console.log('\n--- Google Gemini Configuration ---');
      apiKey = await question('API Key (AIza...): ', true);
      baseUrl = await question('Base URL [https://generativelanguage.googleapis.com/v1beta]: ');
      if (!baseUrl.trim()) baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
      model = await question('Model [gemini-2.5-flash]: ');
      if (!model.trim()) model = 'gemini-2.5-flash';
      break;

    case '6': // Ollama (Offline)
      provider = 'ollama';
      console.log('\n--- Ollama (Offline) Configuration ---');
      console.log('Make sure Ollama is running locally.');
      baseUrl = 'http://localhost:11435/v1'; // Points to local speed proxy
      model = await question('Model [gemma3:1b]: ');
      if (!model.trim()) model = 'gemma3:1b';
      apiKey = 'ollama'; // Ollama doesn't need a real API key
      break;

    case '7': // LM Studio
      provider = 'openai'; // LM Studio uses OpenAI-compatible API
      console.log('\n--- LM Studio Configuration ---');
      console.log('Make sure LM Studio server is running.');
      baseUrl = await question('Base URL [http://localhost:1234/v1]: ');
      if (!baseUrl.trim()) baseUrl = 'http://localhost:1234/v1';
      model = await question('Model (leave empty for server default): ');
      apiKey = 'lm-studio'; // LM Studio doesn't need a real API key
      break;

    case '8': // Custom OpenAI-compatible
      provider = 'custom';
      console.log('\n--- Custom OpenAI-compatible API ---');
      baseUrl = await question('Base URL (e.g., http://localhost:8000/v1): ');
      apiKey = await question('API Key (leave empty if not needed): ', true);
      model = await question('Model name: ');
      break;

    default:
      console.log('\n[✗] Invalid choice. Exiting.');
      rl.close();
      process.exit(1);
  }

  // ─── Build env file content ───
  const lines = [
    '# ═══════════════════════════════════════════════════════════',
    '# Cod3x Code v4.0 - AI Provider Configuration',
    '# Generated by change-provider.js',
    '# ═══════════════════════════════════════════════════════════',
    '',
    `# Provider: ${getProviderName(choice.trim())}`,
    `AI_PROVIDER=${provider}`,
    `MODEL=${model}`,
    `BASE_URL=${baseUrl}`,
  ];

  if (apiKey && apiKey.trim()) {
    lines.push(`API_KEY=${apiKey.trim()}`);

    // Also set provider-specific key variable
    switch (provider) {
      case 'anthropic':
        lines.push(`ANTHROPIC_API_KEY=${apiKey.trim()}`);
        break;
      case 'openai':
        lines.push(`OPENAI_API_KEY=${apiKey.trim()}`);
        break;
      case 'openrouter':
        lines.push(`OPENROUTER_API_KEY=${apiKey.trim()}`);
        break;
      case 'google':
        lines.push(`GOOGLE_API_KEY=${apiKey.trim()}`);
        break;
      case 'ollama':
        lines.push(`OLLAMA_API_KEY=${apiKey.trim()}`);
        break;
    }
  }

  lines.push('');

  // ─── Write to file ───
  fs.writeFileSync(envFile, lines.join('\n'), 'utf-8');

  console.log('\n✅ Provider configuration saved!');
  console.log(`   File: ${envFile}`);
  console.log(`   Provider: ${getProviderName(choice.trim())}`);
  console.log(`   Model: ${model}`);
  console.log(`   Base URL: ${baseUrl}`);
  if (provider === 'ollama') {
    console.log('\n⚠ Make sure the local speed proxy is running (tools/local-proxy.js)');
    console.log('   and Ollama is available at http://localhost:11434');
  }
  console.log('\n🚀 Run cod3x again to use the new provider.\n');

  rl.close();
}

function getProviderName(choice) {
  const names = {
    '1': 'NVIDIA NIM',
    '2': 'Anthropic Claude',
    '3': 'OpenAI',
    '4': 'OpenRouter',
    '5': 'Google Gemini',
    '6': 'Ollama (Local)',
    '7': 'LM Studio',
    '8': 'Custom API',
  };
  return names[choice] || 'Unknown';
}

main().catch(err => {
  console.error('Error:', err.message);
  rl.close();
  process.exit(1);
});
