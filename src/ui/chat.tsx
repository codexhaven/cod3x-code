/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Chat Interface - Cod3x Code v4.0
 * Developed by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { ChatMessage, Config, DebugTrail } from '@codex-types/index';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  onSlashCommand: (command: string, args: string[]) => Promise<void>;
  isThinking: boolean;
  isStreaming: boolean;
  config: Config;
  trail?: DebugTrail;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onSlashCommand,
  isThinking,
  isStreaming,
  config,
  trail,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const handleSubmit = useCallback(
    async (value: string) => {
      if (!value.trim()) return;
      setInput('');
      setHistory((prev) => [...prev, value]);
      setHistoryIndex(-1);

      if (value.startsWith('/')) {
        const parts = value.slice(1).split(' ');
        await onSlashCommand(parts[0], parts.slice(1));
      } else {
        await onSendMessage(value);
      }
    },
    [onSendMessage, onSlashCommand]
  );

  useInput((_, key) => {
    if (key.upArrow && history.length > 0) {
      const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(history[newIndex]);
    }
    if (key.downArrow && historyIndex !== -1) {
      const newIndex = historyIndex + 1;
      if (newIndex >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Messages Area */}
      <Box flexDirection="column" flexGrow={1}>
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} config={config} />
        ))}
        {isThinking && (
          <Box paddingX={2} paddingY={1}>
            <Text color="yellow">
              <Spinner /> Thinking...
            </Text>
          </Box>
        )}
        {isStreaming && (
          <Box paddingX={2} paddingY={1}>
            <Text color="cyan">Streaming...</Text>
          </Box>
        )}
        
        {/* Trail Panel */}
        {trail && trail.steps.length > 0 && (
          <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} marginY={1}>
            <Text bold color="magenta">Debug Trail ({trail.status})</Text>
            {trail.steps.slice(-5).map((step, i) => (
              <Text key={i} color={step.success ? 'green' : 'red'} dimColor={i < trail.steps.length - 3}>
                {step.type}: {step.description.slice(0, 60)}
              </Text>
            ))}
          </Box>
        )}
      </Box>

      {/* Input */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <Text color="cyan">{isThinking ? '...' : '>'} </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Ask Cod3x anything... (/help for commands)"
        />
      </Box>
    </Box>
  );
};

const MessageBubble: React.FC<{ message: ChatMessage; config: Config }> = ({ message, config }) => {
  const colors = config.ui.colors;

  switch (message.role) {
    case 'user':
      return (
        <Box flexDirection="column" paddingX={2} paddingY={1}>
          <Box>
            <Text bold color={colors.user}>You</Text>
          </Box>
          <Box marginLeft={2}>
            <Text>{message.content}</Text>
          </Box>
        </Box>
      );
    case 'assistant':
      return (
        <Box flexDirection="column" paddingX={2} paddingY={1}>
          <Box>
            <Text bold color={colors.assistant}>Cod3x</Text>
            <Text color="gray"> by </Text>
            <Text bold color="green">CodexHaven</Text>
          </Box>
          <Box marginLeft={2}>
            <Text>{message.content}</Text>
          </Box>
        </Box>
      );
    case 'system':
      return (
        <Box paddingX={2} paddingY={1}>
          <Text color={colors.muted}>{message.content}</Text>
        </Box>
      );
    default:
      return (
        <Box paddingX={2} paddingY={1}>
          <Text>{message.content}</Text>
        </Box>
      );
  }
};

const Spinner: React.FC = () => {
  const [frame, setFrame] = React.useState(0);
  const frames = ['\u28B2', '\u28B6', '\u28B7', '\u28BF', '\u28FB', '\u28F9', '\u28E9', '\u28CB'];

  React.useEffect(() => {
    const interval = setInterval(() => setFrame((prev) => (prev + 1) % frames.length), 80);
    return () => clearInterval(interval);
  }, []);

  return <Text>{frames[frame]}</Text>;
};

export default ChatInterface;
