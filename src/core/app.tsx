/**
 * ═══════════════════════════════════════════════════════════════
 * Cod3x Main App Component - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * Enhanced React Ink terminal UI with swarm support,
 * browser integration, and debug trail visualization
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import {
  Config,
  Logger,
  PermissionManager,
  ToolRegistry,
  ConversationMemory,
  MCPManager,
  AgentOrchestrator,
  LLMProviderFactory,
  PlatformInfo,
} from '@codex-types/index';
import { ChatInterface } from '@ui/chat';
import { StatusBar } from '@ui/status-bar';
import { Header } from '@ui/header';
import { useConversation } from '@hooks/use-conversation';
import { useTools } from '@hooks/use-tools';
import { useStreaming } from '@hooks/use-streaming';
import { useTrail } from '@hooks/use-trail';

interface Cod3xAppProps {
  config: Config;
  logger: Logger;
  permissions: PermissionManager;
  toolRegistry: ToolRegistry;
  fileIndex: any;
  memory: ConversationMemory;
  mcpManager: MCPManager;
  agentOrchestrator: AgentOrchestrator;
  llmFactory: LLMProviderFactory;
  platform: PlatformInfo;
}

export const Cod3xApp: React.FC<Cod3xAppProps> = ({
  config,
  logger,
  permissions,
  toolRegistry,
  fileIndex,
  memory,
  mcpManager,
  agentOrchestrator,
  llmFactory,
  platform,
}) => {
  const { exit } = useApp();
  const [mode, setMode] = useState<'chat' | 'agent' | 'swarm' | 'mcp' | 'settings' | 'trail'>('chat');
  const [isThinking, setIsThinking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [showBanner, setShowBanner] = useState(true);

  const { messages, sendMessage, clearMessages, compact } = useConversation({
    config,
    logger,
    memory,
  });

  const { executeTool, executingTools } = useTools({
    toolRegistry,
    permissions,
    logger,
    config,
    llmFactory,
    platform,
  });

  const { streamResponse, isStreaming } = useStreaming({
    config,
    logger,
    llmFactory,
  });

  const { trail, addStep, isRecording } = useTrail({
    config,
    logger,
  });

  // Hide banner after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowBanner(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useInput((input, key) => {
    if (key.escape) {
      if (isThinking || isStreaming) {
        setIsThinking(false);
        setStatusMessage('Cancelled');
      }
    }

    if (key.ctrl && input === 'c') {
      exit();
    }

    if (key.ctrl && input === 'l') {
      clearMessages();
    }

    if (key.ctrl && input === 'o') {
      setMode(mode === 'mcp' ? 'chat' : 'mcp');
    }

    if (key.ctrl && input === 's') {
      setMode(mode === 'swarm' ? 'chat' : 'swarm');
    }

    if (key.ctrl && input === 't') {
      setMode(mode === 'trail' ? 'chat' : 'trail');
    }
  });

  const handleSendMessage = useCallback(
    async (content: string) => {
      setIsThinking(true);
      setStatusMessage('Thinking...');
      addStep('llm_request', 'Processing user message', { input: content });

      try {
        // Check for file references (@file syntax)
        const fileRefs = content.match(/@(\S+)/g);
        let enhancedContent = content;
        
        if (fileRefs) {
          setStatusMessage('Reading files...');
          const fileContents = await Promise.all(
            fileRefs.map(async (ref) => {
              const filePath = ref.slice(1);
              try {
                const content = await fileIndex.getContent(filePath);
                return { file: filePath, content };
              } catch {
                return { file: filePath, content: null };
              }
            })
          );

          const contextBlock = fileContents
            .filter((f) => f.content)
            .map((f) => `--- ${f.file} ---\n${f.content}`)
            .join('\n\n');

          if (contextBlock) {
            enhancedContent = `${content}\n\n[Context from files:]\n${contextBlock}`;
          }
        }

        // Check for swarm mode trigger
        if (content.startsWith('!swarm ') || content.includes('use swarm')) {
          setMode('swarm');
          setStatusMessage('Swarm mode active...');
          
          const objective = content.replace('!swarm ', '').replace('use swarm', '').trim();
          sendMessage(content, 'user');
          
          const result = await agentOrchestrator.executeSwarm(objective);
          
          sendMessage(result.output || result.summary, 'assistant');
          addStep('agent_call', 'Swarm execution completed', { output: result.summary });
          setStatusMessage('Swarm complete');
          setIsThinking(false);
          return;
        }

        // Check for agent mode trigger
        if (content.startsWith('!agent ')) {
          const parts = content.slice(7).split(' ');
          const role = parts[0];
          const task = parts.slice(1).join(' ');
          
          sendMessage(content, 'user');
          setStatusMessage(`Running ${role} agent...`);
          
          const result = await agentOrchestrator.executeAgent(role, {
            id: `task-${Date.now()}`,
            description: task,
          });
          
          sendMessage(result.output || result.summary, 'assistant');
          addStep('agent_call', `Agent ${role} completed`, { output: result.summary });
          setStatusMessage('Agent complete');
          setIsThinking(false);
          return;
        }

        // Check for tool calls (/tool syntax)
        const toolCallMatch = content.match(/^\/(\w+)(.*)/);
        if (toolCallMatch) {
          const toolName = toolCallMatch[1];
          const toolParams = toolCallMatch[2].trim();

          sendMessage(content, 'user');
          setStatusMessage(`Running: ${toolName}...`);
          addStep('tool_call', `Executing tool ${toolName}`, { params: toolParams });

          const result = await executeTool(toolName, toolParams ? JSON.parse(toolParams) : {});
          sendMessage(result.output || result.error || 'Done', result.success ? 'assistant' : 'system');
          addStep('tool_call', `Tool ${toolName} completed`, { success: result.success });
        } else {
          // Main agent loop with tool calling
          sendMessage(content, 'user');
          
          let currentPrompt = enhancedContent;
          let finalResponse = '';
          const MAX_TURNS = 10;

          for (let turn = 0; turn < MAX_TURNS; turn++) {
            setStatusMessage(`Turn ${turn + 1}/${MAX_TURNS}...`);
            
            const response = await streamResponse(currentPrompt);
            
            // Parse tool calls from response
            const toolMatch = response.match(/<cod3x-tool>(.*?)<\/cod3x-tool>\s*<cod3x-params>(.*?)<\/cod3x-params>/s);

            if (!toolMatch) {
              finalResponse = response;
              break;
            }

            try {
              const toolName = toolMatch[1].trim();
              const toolParams = JSON.parse(toolMatch[2].trim());
              
              // Expand ~ in paths
              if (toolParams.path && toolParams.path.startsWith('~')) {
                toolParams.path = toolParams.path.replace('~', platform.homeDir);
              }
              if (toolParams.file && toolParams.file.startsWith('~')) {
                toolParams.file = toolParams.file.replace('~', platform.homeDir);
              }

              setStatusMessage(`Running: ${toolName}...`);
              addStep('tool_call', `Executing ${toolName}`, { params: toolParams });
              
              const result = await executeTool(toolName, toolParams);
              
              currentPrompt = response + '\n<tool_result>' + (result.output || result.error || '').substring(0, 4000) + '</tool_result>\nContinue or give final answer.';
              
              addStep('tool_call', `${toolName} result`, { success: result.success, outputLength: result.output?.length });
            } catch (e) {
              currentPrompt = response + '\n<tool_error>' + (e as Error).message + '</tool_error>\nTry again with correct parameters.';
              addStep('error', `Tool execution error`, { error: (e as Error).message });
            }
          }

          if (!finalResponse) {
            finalResponse = 'Task incomplete after maximum turns. Please refine your request.';
          }
          
          sendMessage(finalResponse, 'assistant');
          addStep('llm_request', 'Response complete', { responseLength: finalResponse.length });
        }
      } catch (error) {
        logger.error('Error processing message', error);
        const errorMsg = `Error: ${error instanceof Error ? error.message : String(error)}`;
        sendMessage(errorMsg, 'system');
        addStep('error', 'Message processing failed', { error: errorMsg });
      } finally {
        setIsThinking(false);
        setStatusMessage('Ready');
      }
    },
    [fileIndex, executeTool, streamResponse, sendMessage, logger, agentOrchestrator, platform, addStep]
  );

  const handleSlashCommand = useCallback(
    async (command: string, args: string[]) => {
      switch (command) {
        case 'exit':
        case 'quit':
          exit();
          break;
        case 'clear':
          clearMessages();
          break;
        case 'compact':
          setStatusMessage('Compacting...');
          await compact();
          setStatusMessage('Compacted');
          break;
        case 'tools':
          const tools = toolRegistry.list();
          sendMessage(
            `Cod3x Tools (${tools.length}):\n${tools
              .map((t) => `  [${t.category}] ${t.name} - ${t.description}`)
              .join('\n')}`,
            'system'
          );
          break;
        case 'agents':
          const agents = agentOrchestrator.getAgents();
          sendMessage(
            `Cod3x Agents (${agents.length}):\n${agents
              .map((a) => `  • ${a.name} (${a.role}) - ${a.description}`)
              .join('\n')}\n\nSwarm: ${config.swarm.enabled ? 'enabled' : 'disabled'}`,
            'system'
          );
          break;
        case 'swarm':
          if (args.length > 0) {
            setMode('swarm');
            const objective = args.join(' ');
            setStatusMessage('Running swarm...');
            const result = await agentOrchestrator.executeSwarm(objective);
            sendMessage(result.output || result.summary, 'assistant');
            setStatusMessage('Swarm complete');
          } else {
            sendMessage('Usage: /swarm <objective description>', 'system');
          }
          break;
        case 'status':
          sendMessage(
            `Cod3x Status:\n  Project: ${config.name}\n  Model: ${config.ai.model}\n  Provider: ${config.ai.provider}\n  Platform: ${platform.type}\n  Tools: ${toolRegistry.list().length}\n  Agents: ${agentOrchestrator.getAgents().length}\n  Swarm: ${config.swarm.enabled ? 'on' : 'off'}\n  Browser: ${config.browser.enabled ? 'on' : 'off'}\n  Trail: ${config.debug.trailEnabled ? 'on' : 'off'}`,
            'system'
          );
          break;
        case 'trail':
          setMode(mode === 'trail' ? 'chat' : 'trail');
          break;
        case 'help':
          sendMessage(
            `Cod3x Code v4.0 by CodexHaven\n\nCommands:\n  /exit, /quit    - Exit Cod3x\n  /clear          - Clear conversation\n  /compact        - Compact conversation\n  /tools          - List all tools\n  /agents         - List all agents\n  /swarm <task>   - Execute with swarm\n  /trail          - Toggle trail view\n  /status         - Show status\n  /help           - Show this help\n\nShortcuts:\n  Ctrl+C   - Exit\n  Ctrl+L   - Clear\n  Ctrl+O   - MCP mode\n  Ctrl+S   - Swarm mode\n  Ctrl+T   - Trail view\n  Esc      - Cancel\n\nSyntax:\n  @file      - Reference a file\n  !agent <role> <task>  - Run agent\n  !swarm <task>         - Run swarm`,
            'system'
          );
          break;
        default:
          sendMessage(`Unknown command: ${command}. Type /help for available commands.`, 'system');
      }
    },
    [exit, clearMessages, compact, toolRegistry, agentOrchestrator, config, platform, sendMessage, mode]
  );

  return (
    <Box flexDirection="column" height="100%">
      <Header
        projectName={config.name}
        model={config.ai.model}
        provider={config.ai.provider}
        platform={platform.type}
        version="4.0.0"
        mode={mode}
      />

      {showBanner && (
        <Box justifyContent="center" paddingY={1}>
          <Text color="green">
            Cod3x Code v4.0 by CodexHaven — Type /help for commands
          </Text>
        </Box>
      )}

      <Box flexDirection="column" flexGrow={1}>
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onSlashCommand={handleSlashCommand}
          isThinking={isThinking}
          isStreaming={isStreaming}
          config={config}
          trail={mode === 'trail' ? trail : undefined}
        />
      </Box>

      <StatusBar
        status={statusMessage}
        model={config.ai.model}
        tools={toolRegistry.list().length}
        agents={agentOrchestrator.getAgents().length}
        files={fileIndex.getStats?.().totalFiles || 0}
        tokens={memory.getTokenCount?.() || 0}
        platform={platform.type}
        mode={mode}
      />
    </Box>
  );
};

export default Cod3xApp;
