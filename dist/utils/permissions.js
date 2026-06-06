export class PermissionManager {
    config;
    cache = new Map();
    constructor(config) {
        this.config = config;
    }
    async ask(request) {
        const key = `${request.action}:${JSON.stringify(request.details)}`;
        if (this.cache.has(key))
            return this.cache.get(key);
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
        const response = { granted: true, permanent: false };
        this.cache.set(key, response);
        return response;
    }
    async check(action, details) {
        const result = await this.ask({ action, details });
        return result.granted;
    }
    addAutoApprove(pattern) { this.config.autoApprovePatterns.push(pattern); }
    addAutoDeny(pattern) { this.config.autoDenyPatterns.push(pattern); }
    clearCache() { this.cache.clear(); }
}
export default PermissionManager;
//# sourceMappingURL=permissions.js.map