import fs from 'fs/promises';
import path from 'path';
import { ConversationMemory as IConversationMemory, ChatMessage, MemoryEntry } from '@codex-types/index';

export class ConversationMemory implements IConversationMemory {
  private messages: ChatMessage[] = [];
  private tokenCount: number = 0;
  private entries: MemoryEntry[] = [];
  private memoryPath: string;

  constructor(cwd: string = process.cwd()) {
    this.memoryPath = path.join(cwd, '.cod3x-memory.json');
  }

  async addMessage(role: ChatMessage['role'], content: string): Promise<void> {
    this.messages.push({ role, content });
    this.tokenCount += content.length / 4;
    await this.persist();
  }

  async getMessages(limit: number = 100): Promise<ChatMessage[]> {
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
    await this.persist();
  }

  async addEntry(entry: MemoryEntry): Promise<void> {
    this.entries.push(entry);
    await this.persist();
  }

  search(query: string, limit: number = 10): MemoryEntry[] {
    const lower = query.toLowerCase();
    return this.entries
      .filter(e => e.content.toLowerCase().includes(lower))
      .slice(-limit);
  }

  private async persist(): Promise<void> {
    try {
      await fs.writeFile(
        this.memoryPath,
        JSON.stringify({ messages: this.messages, entries: this.entries, updated: new Date().toISOString() }, null, 2),
        'utf-8'
      );
    } catch { /* silent */ }
  }

  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.memoryPath, 'utf-8');
      const data = JSON.parse(content);
      this.messages = data.messages || [];
      this.entries = data.entries || [];
      this.tokenCount = this.messages.reduce((sum, m) => sum + m.content.length / 4, 0);
    } catch { /* no saved memory */ }
  }
}

export default ConversationMemory;
