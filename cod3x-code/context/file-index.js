import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export class FileIndex {
  constructor() {
    this.index = new Map();
    this.contentCache = new Map();
    this.lastScan = null;
    this.rootDir = null;
  }
  
  async build(rootDir = '.', options = {}) {
    this.rootDir = path.resolve(rootDir);
    const { ignore = ['node_modules/**', '.git/**', 'dist/**'], extensions = null, maxFiles = 10000 } = options;
    
    const pattern = extensions 
      ? `**/*.{${extensions.join(',')}}`
      : '**/*';
    
    const files = await glob(pattern, {
      cwd: this.rootDir,
      ignore: ignore,
      nodir: true,
      absolute: false
    });
    
    const limited = files.slice(0, maxFiles);
    this.index.clear();
    
    for (const file of limited) {
      try {
        const absolutePath = path.join(this.rootDir, file);
        const stats = await fs.stat(absolutePath);
        
        this.index.set(file, {
          path: file,
          absolutePath: absolutePath,
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime,
          extension: path.extname(file),
          name: path.basename(file),
          directory: path.dirname(file)
        });
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    this.lastScan = Date.now();
    return this.index;
  }
  
  async indexContent(filePath) {
    if (this.contentCache.has(filePath)) {
      return this.contentCache.get(filePath);
    }
    
    try {
      const absolutePath = path.join(this.rootDir, filePath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      
      // Limit cache size
      if (this.contentCache.size > 100) {
        const firstKey = this.contentCache.keys().next().value;
        this.contentCache.delete(firstKey);
      }
      
      this.contentCache.set(filePath, content);
      return content;
    } catch (error) {
      return null;
    }
  }
  
  search(query, options = {}) {
    const { caseSensitive = false, searchContent = false, maxResults = 50 } = options;
    const results = [];
    const searchLower = caseSensitive ? query : query.toLowerCase();
    
    // Search by filename
    for (const [filePath, metadata] of this.index) {
      const comparePath = caseSensitive ? filePath : filePath.toLowerCase();
      if (comparePath.includes(searchLower)) {
        results.push({ type: 'filename', ...metadata, match: filePath });
        if (results.length >= maxResults) break;
      }
    }
    
    return results.slice(0, maxResults);
  }
  
  async searchContent(query, options = {}) {
    const { caseSensitive = false, maxResults = 50, fileLimit = 100 } = options;
    const results = [];
    const regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
    
    let filesToSearch = Array.from(this.index.keys());
    if (fileLimit) filesToSearch = filesToSearch.slice(0, fileLimit);
    
    for (const file of filesToSearch) {
      if (results.length >= maxResults) break;
      
      const content = await this.indexContent(file);
      if (content && regex.test(content)) {
        const lines = content.split('\n');
        const matches = [];
        
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            matches.push({
              line: i + 1,
              content: lines[i].trim().slice(0, 200)
            });
            if (matches.length >= 5) break;
          }
        }
        
        results.push({
          file: file,
          matches: matches,
          metadata: this.index.get(file)
        });
      }
    }
    
    return results;
  }
  
  getFile(filePath) {
    return this.index.get(filePath);
  }
  
  getStats() {
    return {
      totalFiles: this.index.size,
      lastScan: this.lastScan,
      cacheSize: this.contentCache.size,
      rootDir: this.rootDir
    };
  }
  
  async refresh() {
    await this.build(this.rootDir);
  }
}

export default FileIndex;
