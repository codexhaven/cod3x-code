import Database from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

export class ConversationMemory {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(process.cwd(), '.cod3x', 'conversations.db');
    this.db = null;
    this.initialized = false;
  }
  
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new Database.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.db.run(`
          CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            content TEXT,
            metadata TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            this.db.run(`
              CREATE INDEX IF NOT EXISTS idx_session ON conversations(session_id)
            `);
            this.initialized = true;
            resolve();
          }
        });
      });
    });
  }
  
  async addMessage(role, content, metadata = {}, sessionId = null) {
    if (!this.initialized) await this.initialize();
    
    const sid = sessionId || this.getCurrentSessionId();
    const metadataStr = JSON.stringify(metadata);
    
    const run = promisify(this.db.run.bind(this.db));
    await run(
      'INSERT INTO conversations (session_id, role, content, metadata) VALUES (?, ?, ?, ?)',
      sid, role, content, metadataStr
    );
  }
  
  async getMessages(sessionId = null, limit = 100) {
    if (!this.initialized) await this.initialize();
    
    const sid = sessionId || this.getCurrentSessionId();
    const all = promisify(this.db.all.bind(this.db));
    
    return await all(
      'SELECT role, content, metadata, timestamp FROM conversations WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?',
      sid, limit
    );
  }
  
  async getRecentMessages(limit = 20, sessionId = null) {
    const messages = await this.getMessages(sessionId, limit);
    return messages.reverse(); // Oldest first
  }
  
  async getAllMessages(sessionId = null) {
    return await this.getMessages(sessionId, 10000);
  }
  
  async searchMessages(query, sessionId = null) {
    if (!this.initialized) await this.initialize();
    
    const sid = sessionId || this.getCurrentSessionId();
    const all = promisify(this.db.all.bind(this.db));
    
    return await all(
      'SELECT role, content, timestamp FROM conversations WHERE session_id = ? AND content LIKE ? ORDER BY timestamp DESC',
      sid, `%${query}%`
    );
  }
  
  async deleteSession(sessionId) {
    if (!this.initialized) await this.initialize();
    
    const run = promisify(this.db.run.bind(this.db));
    await run('DELETE FROM conversations WHERE session_id = ?', sessionId);
  }
  
  async clear() {
    if (!this.initialized) await this.initialize();
    
    const run = promisify(this.db.run.bind(this.db));
    await run('DELETE FROM conversations');
  }
  
  async compact(sessionId = null, preserveLast = 10) {
    const messages = await this.getMessages(sessionId, 1000);
    if (messages.length <= preserveLast) return;
    
    const toKeep = messages.slice(0, preserveLast);
    const toSummarize = messages.slice(preserveLast);
    
    // Create summary
    const summary = {
      type: 'summary',
      messageCount: toSummarize.length,
      timestamp: Date.now(),
      summary: `Previous conversation with ${toSummarize.length} messages summarized`
    };
    
    await this.deleteSession(sessionId);
    
    // Add summary first
    await this.addMessage('system', JSON.stringify(summary), { is_summary: true }, sessionId);
    
    // Add preserved messages
    for (const msg of toKeep.reverse()) {
      await this.addMessage(msg.role, msg.content, JSON.parse(msg.metadata || '{}'), sessionId);
    }
    
    return {
      compacted: true,
      originalCount: messages.length,
      newCount: toKeep.length + 1,
      messagesRemoved: toSummarize.length
    };
  }
  
  getCurrentSessionId() {
    return process.env.COD3X_SESSION || 'default';
  }
  
  async getSessionStats(sessionId = null) {
    if (!this.initialized) await this.initialize();
    
    const sid = sessionId || this.getCurrentSessionId();
    const get = promisify(this.db.get.bind(this.db));
    
    const result = await get(
      'SELECT COUNT(*) as count, MIN(timestamp) as first, MAX(timestamp) as last FROM conversations WHERE session_id = ?',
      sid
    );
    
    return {
      messageCount: result.count,
      firstMessage: result.first,
      lastMessage: result.last,
      sessionId: sid
    };
  }
  
  async exportConversation(format = 'json', sessionId = null) {
    const messages = await this.getAllMessages(sessionId);
    
    switch(format) {
      case 'json':
        return JSON.stringify(messages, null, 2);
      case 'txt':
        return messages.map(m => `[${m.timestamp}] ${m.role}: ${m.content}`).join('\n');
      case 'md':
        return messages.map(m => `**${m.role}** (${m.timestamp})\n\n${m.content}\n\n`).join('---\n\n');
      default:
        return null;
    }
  }
  
  async close() {
    if (this.db) {
      await promisify(this.db.close.bind(this.db))();
      this.db = null;
      this.initialized = false;
    }
  }
}

export default ConversationMemory;
