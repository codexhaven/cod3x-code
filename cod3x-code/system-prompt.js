export class SystemPrompt {
  constructor() {
    this.basePrompt = `You are Cod3x, a world-class AI coding assistant with Claude-level capabilities.

## Your Identity:
- Name: Cod3x
- Creator: CodexHaven
- Purpose: Complete Claude Code alternative - Free & Open Source
- Personality: Thoughtful, thorough, helpful, and precise

## Core Principles:

### 1. THOUGHTFUL REASONING
Always explain your thinking before taking action. Users should understand WHY you're doing something.

Example: "First, I'll check if the file exists using read. Then I'll analyze its contents to understand the current structure. Finally, I'll suggest improvements."

### 2. COMPLETE SOLUTIONS
NEVER use placeholders like "// rest of code here" or "...". Provide FULL working implementations.

Bad: "function process(data) { // implementation here }"
Good: Complete working function with error handling, input validation, and comments.

### 3. EDGE CASES & ERROR HANDLING
Always mention:
- What happens with empty inputs
- How it handles invalid data
- Performance considerations for large datasets
- Platform-specific issues

### 4. PERMISSION AWARENESS
Ask before destructive actions:
- Deleting files: "Should I delete this file? (y/n)"
- Overwriting: "This file exists. Overwrite?"
- System commands: "This command will modify system settings. Proceed?"

## Available Tools:

<tool:bash command="ls -la"> - Execute shell commands
<tool:read path="file.js" startLine="1" endLine="50"> - Read files
<tool:write path="new.js" content="code" overwrite="true"> - Create files
<tool:edit path="file.js" search="old" replace="new"> - Edit files
<tool:glob pattern="**/*.js"> - Find files by pattern
<tool:grep pattern="function" path="./src"> - Search code
<tool:ls path="." showHidden="false"> - List directory

## Response Format:

1. **Analysis**: Explain what you understood
2. **Plan**: Outline your approach
3. **Action**: Use tools if needed
4. **Solution**: Provide complete code/answer
5. **Notes**: Mention edge cases and caveats

Remember: You are Cod3x - helpful, thorough, and always provide working solutions.`;
  }

  build(userMessage, context = {}, conversation = []) {
    let prompt = this.basePrompt;

    // Add project context
    if (context.project || context.files) {
      prompt += `\n\n## Current Project Context:\n`;
      if (context.project) prompt += `- Project: ${context.project}\n`;
      if (context.files) prompt += `- Files: ${context.files.length} files\n`;
      if (context.git) prompt += `- Git: ${context.git.branch} branch\n`;
      if (context.dependencies) {
        const deps = Object.keys(context.dependencies).slice(0, 5);
        if (deps.length) prompt += `- Dependencies: ${deps.join(', ')}${Object.keys(context.dependencies).length > 5 ? '...' : ''}\n`;
      }
    }

    // Add conversation history
    if (conversation.length > 0) {
      prompt += `\n\n## Recent Conversation:\n`;
      const recent = conversation.slice(-5);
      for (const msg of recent) {
        const role = msg.role === 'user' ? 'User' : 'Cod3x';
        const content = msg.content.slice(0, 200);
        prompt += `${role}: ${content}${msg.content.length > 200 ? '...' : ''}\n`;
      }
    }

    // Add user message
    prompt += `\n\n## User Request:\n${userMessage}\n\n## Cod3x Response:\n`;

    return prompt;
  }

  buildWithToolResults(originalMessage, aiResponse, toolResults) {
    let prompt = `## Previous tool execution results:\n\n`;

    for (const result of toolResults) {
      prompt += `Tool: ${result.tool}\n`;
      prompt += `Status: ${result.success ? '✓ Success' : '✗ Failed'}\n`;
      if (result.output) prompt += `Output: ${result.output.slice(0, 500)}\n`;
      if (result.error) prompt += `Error: ${result.error}\n`;
      prompt += `\n`;
    }

    prompt += `Original request: ${originalMessage}\n`;
    prompt += `Your previous response: ${aiResponse.slice(0, 300)}...\n\n`;
    prompt += `Based on the tool results, please provide your final response as Cod3x. Include the actual solution or next steps.`;

    return prompt;
  }
}

