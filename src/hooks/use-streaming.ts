/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Streaming Hook - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * Unified streaming via LLMProviderFactory with fallback
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react';
import { Config, Logger, LLMProviderFactory, ChatMessage } from '@codex-types/index';

interface UseStreamingOptions {
  config: Config;
  logger: Logger;
  llmFactory: LLMProviderFactory;
}

export function useStreaming({ config, logger, llmFactory }: UseStreamingOptions) {
  const [isStreaming, setIsStreaming] = useState(false);

  const streamResponse = useCallback(async (prompt: string): Promise<string> => {
    setIsStreaming(true);
    logger.debug('Streaming response', { promptLength: prompt.length });

    try {
      const systemPrompt = `You are Cod3x, an expert AI coding assistant developed by CodexHaven. You help with coding tasks using available tools.

When you need to use a tool, format your response exactly as:
<cod3x-tool>tool_name</cod3x-tool>
<cod3x-params>{"param1": "value1", "param2": "value2"}</cod3x-params>

Available tool categories:
- filesystem: read_file, write_file, edit_file, list_directory, glob_search, grep_search, find_files, copy_file, move_file, remove_file, file_stat, read_json, write_json
- execution: bash, spawn, eval_code
- git: git_status, git_commit, git_branch, git_diff, git_log, git_checkout, git_stash, git_merge, git_remote
- code: analyze_code, lint_code, format_code, generate_tests, refactor_code, count_tokens, extract_imports, find_dead_code
- search: search_code, semantic_search, file_search
- network: fetch_url, download_file, web_search
- browser: browse_page, scrape_content, screenshot_page, click_element, fill_form
- debug: trail_start, trail_stop, set_breakpoint, inspect_variable, stack_trace
- ai: think, complex_prompt, multi_step

After receiving tool results, provide a final answer without tool tags.`;

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ];

      let fullResponse = '';
      
      const response = await llmFactory.stream(
        messages,
        (token) => {
          fullResponse += token;
          process.stdout.write(token);
        },
        {
          model: config.ai.model,
          temperature: config.ai.temperature,
          maxTokens: config.ai.maxTokens,
        }
      );

      // If stream didn't provide tokens, use the full response
      if (!fullResponse && response) {
        fullResponse = response;
      }

      logger.debug('Stream complete', { responseLength: fullResponse.length });
      return fullResponse;
    } catch (error) {
      logger.error('Streaming error', error);
      return `Error: ${(error as Error).message}. Check your proxy/API configuration.`;
    } finally {
      setIsStreaming(false);
    }
  }, [config, logger, llmFactory]);

  return { streamResponse, isStreaming };
}

export default useStreaming;
