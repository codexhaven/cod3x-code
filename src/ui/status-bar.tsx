import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  status: string;
  model: string;
  tools: number;
  agents: number;
  files: number;
  tokens: number;
  platform: string;
  mode: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ status, model, tools, agents, files, tokens, platform, mode }) => {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
      <Text color={status === 'Ready' ? 'green' : 'yellow'}>Status: {status}</Text>
      <Text color="gray">|</Text>
      <Text color="green">{model}</Text>
      <Text color="gray">|</Text>
      <Text color="yellow">Tools:{tools}</Text>
      <Text color="gray">|</Text>
      <Text color="magenta">Agents:{agents}</Text>
      <Text color="gray">|</Text>
      <Text color="blue">Files:{files}</Text>
      <Text color="gray">|</Text>
      <Text color="cyan">Tokens:{tokens.toLocaleString()}</Text>
      <Text color="gray">|</Text>
      <Text color="red">{platform}</Text>
    </Box>
  );
};

export default StatusBar;
