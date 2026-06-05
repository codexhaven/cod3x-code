import React from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  projectName: string;
  model: string;
  provider: string;
  platform: string;
  version: string;
  mode: string;
}

export const Header: React.FC<HeaderProps> = ({ projectName, model, provider, platform, version, mode }) => {
  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={2} paddingY={1}>
      <Box justifyContent="center">
        <Text bold color="cyan">
          {'\u2554'}{''.repeat(45)}{'\u2557'}
        </Text>
      </Box>
      <Box justifyContent="center">
        <Text bold color="green">
          {'\u2551'}  Cod3x Code v{version} by CodexHaven {'\u2551'}
        </Text>
      </Box>
      <Box justifyContent="center">
        <Text bold color="cyan">
          {'\u255A'}{''.repeat(45)}{'\u255D'}
        </Text>
      </Box>
      <Box justifyContent="space-between" marginTop={1}>
        <Text color="gray">
          Project: <Text color="yellow">{projectName}</Text>
        </Text>
        <Text color="gray">
          Model: <Text color="green">{model}</Text>
        </Text>
        <Text color="gray">
          Platform: <Text color="magenta">{platform}</Text>
        </Text>
        <Text color="gray">
          Mode: <Text color="blue">{mode}</Text>
        </Text>
      </Box>
    </Box>
  );
};

export default Header;
