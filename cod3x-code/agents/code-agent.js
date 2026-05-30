import { execSync } from 'child_process';

export class CodeAgent {
  constructor(llm, tools) {
    this.llm = llm;
    this.tools = tools;
  }
  
  async generateCode(spec, language = 'javascript', options = {}) {
    const prompt = `Generate production-ready ${language} code for the following specification:

${spec}

Requirements:
- Complete working implementation (no placeholders or TODOs)
- Comprehensive error handling
- Input validation where appropriate
- Comments explaining complex logic
- Consider edge cases (empty inputs, null values, large datasets)
- Follow ${language} best practices and conventions

Return ONLY the code, wrapped in \`\`\`${language} blocks.`;
    
    const response = await this.llm.chat(prompt);
    return this.extractCode(response, language);
  }
  
  async reviewCode(code, language = 'javascript') {
    const prompt = `Perform a thorough code review of this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Provide feedback on:
1. **Correctness**: Are there any bugs or logical errors?
2. **Security**: Any vulnerabilities (injection, XSS, auth issues)?
3. **Performance**: Inefficient algorithms, memory leaks, bottlenecks?
4. **Maintainability**: Code organization, naming, comments?
5. **Best Practices**: Does it follow ${language} conventions?
6. **Error Handling**: Are edge cases properly handled?
7. **Testing**: What tests should be added?

Format your response with clear sections and specific line numbers where applicable.`;
    
    return await this.llm.chat(prompt);
  }
  
  async debugCode(error, code, context = '') {
    const prompt = `Debug the following error:

**Error:**
${error}

**Code:**
\`\`\`
${code}
\`\`\`

**Context:**
${context || 'No additional context provided'}

Please:
1. Identify the root cause of the error
2. Explain why it's happening
3. Provide the corrected code
4. Suggest prevention strategies

Return the fixed code wrapped in \`\`\` blocks.`;
    
    const response = await this.llm.chat(prompt);
    return {
      analysis: response,
      fixedCode: this.extractCode(response)
    };
  }
  
  async refactorCode(code, instructions = 'improve code quality and maintainability') {
    const prompt = `Refactor the following code to ${instructions}:

\`\`\`
${code}
\`\`\`

Requirements:
- Maintain the same functionality
- Improve readability and structure
- Add appropriate comments
- Handle edge cases
- Follow best practices

Provide:
1. The refactored code
2. A list of changes made
3. Explanation of why these improvements help

Return the refactored code wrapped in \`\`\` blocks.`;
    
    const response = await this.llm.chat(prompt);
    return {
      refactoredCode: this.extractCode(response),
      explanation: response
    };
  }
  
  async explainCode(code, language = 'javascript') {
    const prompt = `Explain this ${language} code in detail:

\`\`\`${language}
${code}
\`\`\`

Include:
1. **Purpose**: What does this code do?
2. **Flow**: How does it work step by step?
3. **Key Components**: Important functions/classes
4. **Complexity**: Time and space complexity
5. **Potential Issues**: Any concerns or edge cases

Make it understandable for intermediate developers.`;
    
    return await this.llm.chat(prompt);
  }
  
  async addTests(code, language = 'javascript') {
    const testFramework = language === 'javascript' ? 'Jest' : 
                          language === 'python' ? 'pytest' : 
                          language === 'go' ? 'testing' : 'standard';
    
    const prompt = `Generate comprehensive ${testFramework} tests for this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Include tests for:
- Normal/expected inputs
- Edge cases (empty, null, boundary values)
- Error conditions
- Performance (if applicable)

Return complete test files with proper imports and setup.`;
    
    const response = await this.llm.chat(prompt);
    return this.extractCode(response);
  }
  
  extractCode(response, language = 'javascript') {
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
    const matches = [...response.matchAll(codeBlockRegex)];
    
    if (matches.length > 0) {
      return matches.map(m => m[1].trim()).join('\n\n');
    }
    return response;
  }
  
  async analyzeDependencies(code, language = 'javascript') {
    // Parse imports/requires based on language
    const patterns = {
      javascript: /(?:import|require)\(?['"]([^'"]+)['"]\)?/g,
      python: /(?:import|from)\s+(\w+)/g,
      go: /import\s+(?:"([^"]+)"|\(([^)]+)\))/gs
    };
    
    const pattern = patterns[language] || patterns.javascript;
    const matches = [...code.matchAll(pattern)];
    const dependencies = matches.map(m => m[1]).filter(Boolean);
    
    return {
      language,
      dependencies: [...new Set(dependencies)],
      count: dependencies.length
    };
  }
  
  async suggestImprovements(code, language = 'javascript') {
    const review = await this.reviewCode(code, language);
    const improvements = {
      performance: [],
      security: [],
      readability: [],
      bestPractices: []
    };
    
    // Parse review response for improvement suggestions
    const sections = review.split(/\n\n/);
    for (const section of sections) {
      if (section.toLowerCase().includes('performance')) improvements.performance.push(section);
      if (section.toLowerCase().includes('security')) improvements.security.push(section);
      if (section.toLowerCase().includes('readability')) improvements.readability.push(section);
      if (section.toLowerCase().includes('best practice')) improvements.bestPractices.push(section);
    }
    
    return improvements;
  }
}

export default CodeAgent;
