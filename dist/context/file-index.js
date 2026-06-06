import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
export class FileIndex {
    index = new Map();
    contentCache = new Map();
    lastScan = null;
    rootDir = '.';
    async build(rootDir = '.', options) {
        this.rootDir = path.resolve(rootDir);
        const files = await glob('**/*', {
            cwd: this.rootDir,
            ignore: options.excludePatterns,
            nodir: true,
            absolute: false,
        });
        this.index.clear();
        for (const file of files.slice(0, options.maxFiles)) {
            try {
                const stats = await fs.stat(path.join(this.rootDir, file));
                this.index.set(file, { path: file, size: stats.size, modified: stats.mtime, extension: path.extname(file) });
            }
            catch { /* skip */ }
        }
        this.lastScan = Date.now();
    }
    async getContent(filePath) {
        if (this.contentCache.has(filePath))
            return this.contentCache.get(filePath);
        try {
            const content = await fs.readFile(path.join(this.rootDir, filePath), 'utf-8');
            if (this.contentCache.size > 100) {
                const firstKey = this.contentCache.keys().next().value;
                if (firstKey)
                    this.contentCache.delete(firstKey);
            }
            this.contentCache.set(filePath, content);
            return content;
        }
        catch {
            return null;
        }
    }
    getStats() {
        return { totalFiles: this.index.size };
    }
}
export default FileIndex;
//# sourceMappingURL=file-index.js.map