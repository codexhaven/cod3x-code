import { PermissionManager as IPermissionManager, PermissionRequest, PermissionResponse, PermissionConfig } from '@codex-types/index';
export declare class PermissionManager implements IPermissionManager {
    private config;
    private cache;
    constructor(config: PermissionConfig);
    ask(request: PermissionRequest): Promise<PermissionResponse>;
    check(action: string, details: Record<string, unknown>): Promise<boolean>;
    addAutoApprove(pattern: string): void;
    addAutoDeny(pattern: string): void;
    clearCache(): void;
}
export default PermissionManager;
//# sourceMappingURL=permissions.d.ts.map