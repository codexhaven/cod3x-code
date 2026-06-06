/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Conversation Memory - Cod3x Code v4.0
 * Developed by CodexHaven
 * 
 * Persistent conversation storage with SQLite (when available)
 * and JSON file fallback for all platforms including Termux
 * ═══════════════════════════════════════════════════════════════
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ConversationMemory as IConversationMemory, ChatMessage, MemoryEntry } from '@codex-types/index';

export class ConversationMemory implements IConversationMemory {
  private messages: ChatMessage[] = [];
  private tokenCount: number = 0;
  private entries: MemoryEntry[] = [];
  private memoryPath: string;
  private dbPath: string;
  private sqlite: any = null;
  private useSQLite: boolean = false;

  constructor(cwd: string = process.cwd()) {
    // Use .cod3x directory for storage if it exists, otherwise cwd
    const cod3xDir = path.join(cwd, '.cod3x', 'memory');
    this.memoryPath = path.join(cod3xDir, 'conversations.json');
    this.dbPath = path.join(cod3xDir, 'memory.db');

    // Try to initialize SQLite
    this.initSQLite().catch(() => {
      this.useSQLite = false;
    });
  }

  private async initSQLite(): Promise<void> {
    try {
      // Dynamic import to avoid hard dependency
      // @ts-ignore - optional dependency, fallback to JSON if not available
      const { default: Database } = await import('better-sqlite3');
      this.sqlite = new Database(this.dbPath);
      this.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS memory_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          content TEXT NOT NULL,
          metadata TEXT,
          timestamp INTEGER NOT NULL,
          importance REAL DEFAULT 0.5
        );
        CREATE INDEX IF NOT EXISTS idx_messages_time ON messages(timestamp);
        CREATE INDEX IF NOT EXISTS idx_entries_type ON memory_entries(type);
      `);
      this.useSQLite = true;
    } catch {
      // SQLite not available, use JSON fallback
      this.useSQLite = false;
    }
  }

  async addMessage(role: ChatMessage['role'], content: string): Promise<void> {
    this.messages.push({ role, content });
    this.tokenCount += content.length / 4;

    if (this.useSQLite && this.sqlite) {
      try {
        const stmt = this.sqlite.prepare('INSERT INTO messages (role, content, timestamp) VALUES (?, ?, ?)');
        stmt.run(role, content, Date.now());
      } catch {
        // Fall through to JSON persistence
      }
    }

    await this.persist();
  }

  async getMessages(limit: number = 100): Promise<ChatMessage[]> {
    if (this.useSQLite && this.sqlite) {
      try {
        const stmt = this.sqlite.prepare('SELECT role, content FROM messages ORDER BY timestamp DESC LIMIT ?');
        const rows = stmt.all(limit);
        return rows.reverse().map((r: any) => ({ role: r.role, content: r.content }));
      } catch {
        // Fall back to in-memory
      }
    }
    return this.messages.slice(-limit);
  }

  getTokenCount(): number {
    return Math.round(this.tokenCount);
  }

  async compact(): Promise<void> {
    if (this.messages.length <= 10) return;
    
    const summary = `[Summary of ${this.messages.length} messages by Cod3x]`;
    this.messages = [{ role: 'system', content: summary }];
    this.tokenCount = summary.length / 4;

    if (this.useSQLite && this.sqlite) {
      try {
        this.sqlite.exec('DELETE FROM messages');
        const stmt = this.sqlite.prepare('INSERT INTO messages (role, content, timestamp) VALUES (?, ?, ?)');
        stmt.run('system', summary, Date.now());
      } catch {
        // Fall through
      }
    }

    await this.persist();
  }

  async addEntry(entry: MemoryEntry): Promise<void> {
    this.entries.push(entry);

    if (this.useSQLite && this.sqlite) {
      try {
        const stmt = this.sqlite.prepare('INSERT INTO memory_entries (type, content, metadata, timestamp, importance) VALUES (?, ?, ?, ?, ?)');
        stmt.run(entry.type, entry.content, JSON.stringify(entry.metadata), entry.timestamp.getTime(), entry.importance);
      } catch {
        // Fall through
      }
    }

    await this.persist();
  }

  search(query: string, limit: number = 10): MemoryEntry[] {
    const lower = query.toLowerCase();

    if (this.useSQLite && this.sqlite) {
      try {
        const stmt = this.sqlite.prepare('SELECT * FROM memory_entries WHERE content LIKE ? ORDER BY timestamp DESC LIMIT ?');
        const rows = stmt.all(`%${lower}%`, limit);
        return rows.map((r: any) => ({
          id: String(r.id),
          type: r.type,
          content: r.content,
          metadata: JSON.parse(r.metadata || '{}'),
          timestamp: new Date(r.timestamp),
          importance: r.importance,
        }));
      } catch {
        // Fall through
      }
    }

    return this.entries
      .filter(e => e.content.toLowerCase().includes(lower))
      .slice(-limit);
  }

  private async persist(): Promise<void> {
    try {
      const dir = path.dirname(this.memoryPath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(
        this.memoryPath,
        JSON.stringify({
          messages: this.messages,
          entries: this.entries,
          tokenCount: this.tokenCount,
          updated: new Date().toISOString(),
          version: '2.0',
          by: 'Cod3x by CodexHaven',
        }, null, 2),
        'utf-8'
      );
    } catch {
      // Silent fail - memory is ephemeral
    }
  }

  async load(): Promise<void> {
    // Try JSON first
    try {
      const content = await fs.readFile(this.memoryPath, 'utf-8');
      const data = JSON.parse(content);
      this.messages = data.messages || [];
      this.entries = data.entries || [];
      this.tokenCount = data.tokenCount || this.messages.reduce((sum, m) => sum + m.content.length / 4, 0);
    } catch {
      // No saved memory, start fresh
    }
  }

  /**
   * Get conversation statistics
   */
  getStats(): { messageCount: number; entryCount: number; tokenCount: number; storage: string } {
    return {
      messageCount: this.messages.length,
      entryCount: this.entries.length,
      tokenCount: Math.round(this.tokenCount),
      storage: this.useSQLite ? 'sqlite' : 'json',
    };
  }

  /**
   * Export memory to various formats
   */
  export(format: 'json' | 'md'): string {
    if (format === 'md') {
      const lines = [
        '# Cod3x Conversation Memory',
        `Generated: ${new Date().toISOString()}`,
        '',
        '## Messages',
        ...this.messages.map(m => `**${m.role}**: ${m.content.slice(0, 200)}`),
        '',
        '## Memory Entries',
        ...this.entries.map(e => `- **${e.type}**: ${e.content.slice(0, 200)}`),
      ];
      return lines.join('\n');
    }

    return JSON.stringify({ messages: this.messages, entries: this.entries }, null, 2);
  }

  /**
   * Clear all memory
   */
  async clear(): Promise<void> {
    this.messages = [];
    this.entries = [];
    this.tokenCount = 0;

    if (this.useSQLite && this.sqlite) {
      try {
        this.sqlite.exec('DELETE FROM messages');
        this.sqlite.exec('DELETE FROM memory_entries');
      } catch {
        // Ignore
      }
    }

    await this.persist();
  }
}

export default ConversationMemory;
