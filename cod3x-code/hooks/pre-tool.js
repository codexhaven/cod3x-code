export class PreToolHook {
  constructor(config = {}) {
    this.config = {
      validatePaths: true,
      checkPermissions: true,
      validateParams: true,
      maxFileSize: 10 * 1024 * 1024,
      blockedCommands: ['rm -rf /', 'sudo', 'mkfs', 'dd if=', ':(){', 'del /f', 'format'],
      allowedPaths: [process.cwd()],
      ...config
    };
  }
  
  async beforeExecute(toolName, params) {
    const results = {
      allowed: true,
      modifiedParams: { ...params },
      warnings: [],
      errors: []
    };
    
    // Validate parameters
    if (this.config.validateParams) {
      const paramValidation = this.validateParams(toolName, params);
      if (!paramValidation.valid) {
        results.allowed = false;
        results.errors.push(paramValidation.error);
        return results;
      }
    }
    
    // Path validation
    if (this.config.validatePaths && (params.path || params.cwd)) {
      const pathValidation = this.validatePaths(toolName, params);
      if (!pathValidation.valid) {
        results.allowed = false;
        results.errors.push(pathValidation.error);
        return results;
      }
    }
    
    // Command security check
    if (toolName === 'bash' && params.command) {
      const securityCheck = this.checkCommandSecurity(params.command);
      if (!securityCheck.safe) {
        results.allowed = false;
        results.errors.push(`Security: ${securityCheck.reason}`);
        return results;
      }
      if (securityCheck.warnings.length) {
        results.warnings.push(...securityCheck.warnings);
      }
    }
    
    // File size check
    if (toolName === 'write' && params.content && params.content.length > this.config.maxFileSize) {
      results.allowed = false;
      results.errors.push(`Content too large: ${params.content.length} bytes (max ${this.config.maxFileSize})`);
      return results;
    }
    
    // Permission check
    if (this.config.checkPermissions && this.requiresPermission(toolName)) {
      const permission = await this.checkPermission(toolName, params);
      if (!permission.granted) {
        results.allowed = false;
        results.errors.push(`Permission denied: ${permission.reason}`);
        return results;
      }
    }
    
    return results;
  }
  
  validateParams(toolName, params) {
    const requiredParams = {
      bash: ['command'],
      read: ['path'],
      write: ['path', 'content'],
      edit: ['path', 'search', 'replace'],
      glob: ['pattern'],
      grep: ['pattern'],
      ls: [],
      notebook: ['path', 'cell_index']
    };
    
    const required = requiredParams[toolName] || [];
    for (const param of required) {
      if (!params[param] && params[param] !== '') {
        return { valid: false, error: `Missing required parameter: ${param}` };
      }
    }
    
    return { valid: true };
  }
  
  validatePaths(toolName, params) {
    const paths = [];
    if (params.path) paths.push(params.path);
    if (params.cwd) paths.push(params.cwd);
    
    for (const p of paths) {
      // Check for path traversal
      if (p.includes('..') || p.includes('~')) {
        return { valid: false, error: `Path traversal not allowed: ${p}` };
      }
      
      // Check if within allowed paths
      const resolved = require('path').resolve(process.cwd(), p);
      const isAllowed = this.config.allowedPaths.some(allowed => 
        resolved.startsWith(require('path').resolve(allowed))
      );
      
      if (!isAllowed) {
        return { valid: false, error: `Path outside allowed directories: ${p}` };
      }
    }
    
    return { valid: true };
  }
  
  checkCommandSecurity(command) {
    const lowerCommand = command.toLowerCase();
    const warnings = [];
    
    // Check blocked commands
    for (const blocked of this.config.blockedCommands) {
      if (lowerCommand.includes(blocked.toLowerCase())) {
        return { safe: false, reason: `Blocked command pattern: ${blocked}`, warnings: [] };
      }
    }
    
    // Warning patterns
    const warningPatterns = [
      { pattern: /rm\s+/, warning: 'Delete operation - ensure correct path' },
      { pattern: />\s*\/dev\/sd/, warning: 'Writing directly to disk - very dangerous' },
      { pattern: /chmod\s+777/, warning: 'Overly permissive permissions' },
      { pattern: /curl.*\|\s*bash/, warning: 'Piping from internet to shell - verify source' }
    ];
    
    for (const { pattern, warning } of warningPatterns) {
      if (pattern.test(lowerCommand)) {
        warnings.push(warning);
      }
    }
    
    return { safe: true, warnings };
  }
  
  requiresPermission(toolName) {
    const dangerousTools = ['bash', 'write', 'edit', 'delete', 'notebook'];
    return dangerousTools.includes(toolName);
  }
  
  async checkPermission(toolName, params) {
    // This would typically ask the user via UI
    // For now, return granted
    return { granted: true, reason: 'auto-approved' };
  }
  
  // Additional validators
  validateFileType(filePath, allowedExtensions) {
    const ext = require('path').extname(filePath);
    if (allowedExtensions && !allowedExtensions.includes(ext)) {
      return { valid: false, error: `File type ${ext} not allowed` };
    }
    return { valid: true };
  }
  
  validateContent(content, maxLength = 1000000) {
    if (content.length > maxLength) {
      return { valid: false, error: `Content exceeds maximum length (${maxLength})` };
    }
    return { valid: true };
  }
}

export default PreToolHook;
