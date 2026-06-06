import { FileIndex as IFileIndex, ContextConfig } from '@codex-types/index';
export declare class FileIndex implements IFileIndex {
    private index;
    private contentCache;
    private lastScan;
    private rootDir;
    build(rootDir: string | undefined, options: ContextConfig): Promise<void>;
    getContent(filePath: string): Promise<string | null>;
    getStats(): {
        totalFiles: number;
    };
}
export default FileIndex;
//# sourceMappingURL=file-index.d.ts.map