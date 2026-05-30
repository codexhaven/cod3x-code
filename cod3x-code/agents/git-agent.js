import simpleGit from 'simple-git';
import { execSync } from 'child_process';

export class GitAgent {
  constructor() {
    this.git = simpleGit();
  }
  
  async initialize() {
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        await this.git.init();
        return { initialized: true, message: 'Git repository initialized' };
      }
      return { initialized: true, message: 'Git repository already exists' };
    } catch (error) {
      return { initialized: false, error: error.message };
    }
  }
  
  async commit(message, files = ['.']) {
    try {
      if (files.length > 0) {
        await this.git.add(files);
      }
      const result = await this.git.commit(message);
      return {
        success: true,
        commit: result.commit,
        message: `✓ Committed: ${message}`,
        files: result.summary?.changed || 0
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async generateCommitMessage(diff) {
    const prompt = `Generate a clear, concise commit message for these changes:

${diff.slice(0, 2000)}

Follow conventional commit format:
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore

Return only the commit message.`;
    
    // For now, return a default message
    return 'Update code with Cod3x improvements';
  }
  
  async createBranch(name) {
    try {
      await this.git.checkoutLocalBranch(name);
      return { success: true, branch: name, message: `✓ Created and switched to branch: ${name}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async switchBranch(name) {
    try {
      await this.git.checkout(name);
      return { success: true, branch: name, message: `✓ Switched to branch: ${name}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getStatus() {
    try {
      const status = await this.git.status();
      return {
        success: true,
        branch: status.current,
        staged: status.staged.length,
        modified: status.modified.length,
        untracked: status.not_added.length,
        files: [
          ...status.staged.map(f => ({ path: f, status: 'staged' })),
          ...status.modified.map(f => ({ path: f, status: 'modified' })),
          ...status.not_added.map(f => ({ path: f, status: 'untracked' }))
        ]
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async createPullRequest(title, body, base = 'main', head = null) {
    try {
      head = head || (await this.git.revparse(['--abbrev-ref', 'HEAD']));
      
      // Push branch first
      await this.git.push('origin', head, { '--set-upstream': null });
      
      // For GitHub CLI
      try {
        const prUrl = execSync(`gh pr create --title "${title}" --body "${body}" --base ${base} --head ${head}`, {
          encoding: 'utf-8'
        }).trim();
        
        return {
          success: true,
          url: prUrl,
          title: title,
          base: base,
          head: head
        };
      } catch (error) {
        // If gh CLI not available, provide instructions
        return {
          success: true,
          manual: true,
          instructions: `Push branch and create PR:\n  git push origin ${head}\n  Then create PR on GitHub from ${head} to ${base}`,
          title: title,
          base: base,
          head: head
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getDiff(branch1 = 'HEAD', branch2 = null) {
    try {
      let diff;
      if (branch2) {
        diff = await this.git.diff([branch1, branch2]);
      } else {
        diff = await this.git.diff();
      }
      return {
        success: true,
        diff: diff,
        lines: diff.split('\n').length,
        changes: this.parseDiffStats(diff)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  parseDiffStats(diff) {
    const lines = diff.split('\n');
    let additions = 0;
    let deletions = 0;
    
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) additions++;
      if (line.startsWith('-') && !line.startsWith('---')) deletions++;
    }
    
    return { additions, deletions, total: additions + deletions };
  }
  
  async stash(message = null) {
    try {
      const result = await this.git.stash(message ? ['push', '-m', message] : ['push']);
      return { success: true, message: 'Changes stashed', stash: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async popStash() {
    try {
      await this.git.stash(['pop']);
      return { success: true, message: 'Stash applied' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getLog(limit = 10) {
    try {
      const log = await this.git.log({ '--max-count': limit });
      return {
        success: true,
        commits: log.all.map(commit => ({
          hash: commit.hash.slice(0, 7),
          date: commit.date,
          message: commit.message,
          author: commit.author_name
        })),
        count: log.total
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async reset(hard = false, commit = 'HEAD~1') {
    try {
      if (hard) {
        await this.git.reset(['--hard', commit]);
        return { success: true, message: `Hard reset to ${commit}` };
      } else {
        await this.git.reset(['--soft', commit]);
        return { success: true, message: `Soft reset to ${commit}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getRemoteInfo() {
    try {
      const remotes = await this.git.getRemotes(true);
      return {
        success: true,
        remotes: remotes.map(r => ({
          name: r.name,
          url: r.refs.fetch
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default GitAgent;
