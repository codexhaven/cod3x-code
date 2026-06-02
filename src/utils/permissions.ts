import { PermissionManager as IPermissionManager, PermissionRequest, PermissionResponse, PermissionConfig } from '@codex-types/index';

export class PermissionManager implements IPermissionManager {
  private config: PermissionConfig;
  private cache: Map<string, PermissionResponse> = new Map();

  constructor(config: PermissionConfig) {
    this.config = config;
  }

  async ask(request: PermissionRequest): Promise<PermissionResponse> {
    const key = `${request.action}:${JSON.stringify(request.details)}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    for (const pattern of this.config.autoApprovePatterns) {
      if (new RegExp(pattern).test(JSON.stringify(request.details))) {
        return { granted: true, permanent: false };
      }
    }

    for (const pattern of this.config.autoDenyPatterns) {
      if (new RegExp(pattern).test(JSON.stringify(request.details))) {
        return { granted: false, permanent: false, reason: 'Auto-denied' };
      }
    }

    const response: PermissionResponse = { granted: true, permanent: false };
    this.cache.set(key, response);
    return response;
  }

  async check(action: string, details: Record<string, unknown>): Promise<boolean> {
    const result = await this.ask({ action, details });
    return result.granted;
  }

  addAutoApprove(pattern: string): void { this.config.autoApprovePatterns.push(pattern); }
  addAutoDeny(pattern: string): void { this.config.autoDenyPatterns.push(pattern); }
  clearCache(): void { this.cache.clear(); }
}

export default PermissionManager;
