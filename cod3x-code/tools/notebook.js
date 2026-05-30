import fs from 'fs/promises';
import path from 'path';

export async function execute(params) {
  const { path: notebookPath, cell_index, content, operation = 'replace', cell_type = 'code' } = params;
  
  try {
    const absolutePath = path.resolve(process.cwd(), notebookPath);
    
    // Security check
    if (!absolutePath.endsWith('.ipynb')) {
      return { success: false, error: 'Not a Jupyter notebook file (.ipynb required)' };
    }
    
    const notebookData = await fs.readFile(absolutePath, 'utf-8');
    let notebook;
    try {
      notebook = JSON.parse(notebookData);
    } catch (error) {
      return { success: false, error: 'Invalid notebook JSON format' };
    }
    
    if (!notebook.cells || !Array.isArray(notebook.cells)) {
      return { success: false, error: 'Invalid notebook structure: missing cells array' };
    }
    
    const cellIdx = parseInt(cell_index);
    if (isNaN(cellIdx)) {
      return { success: false, error: 'Invalid cell_index: must be a number' };
    }
    
    let oldContent = '';
    let newContent = '';
    
    if (cellIdx >= 0 && cellIdx < notebook.cells.length) {
      // Edit existing cell
      const cell = notebook.cells[cellIdx];
      oldContent = cell.source.join ? cell.source.join('') : cell.source;
      
      switch(operation) {
        case 'replace':
          cell.source = typeof content === 'string' ? content.split('\n') : content;
          newContent = content;
          break;
        case 'insert':
          const currentSource = cell.source;
          const insertContent = typeof content === 'string' ? content.split('\n') : content;
          cell.source = [...currentSource, ...insertContent];
          newContent = cell.source.join('\n');
          break;
        case 'delete':
          cell.source = [];
          newContent = '';
          break;
        default:
          return { success: false, error: `Unknown operation: ${operation}` };
      }
      
      if (cell_type && cell.cell_type !== cell_type) {
        cell.cell_type = cell_type;
      }
    } else if (operation === 'add' && cellIdx === notebook.cells.length) {
      // Add new cell
      const newCell = {
        cell_type: cell_type,
        metadata: {},
        source: typeof content === 'string' ? content.split('\n') : content,
        outputs: []
      };
      notebook.cells.push(newCell);
      newContent = content;
    } else {
      return { success: false, error: `Cell index ${cellIdx} out of range. Notebook has ${notebook.cells.length} cells.` };
    }
    
    // Write back
    await fs.writeFile(absolutePath, JSON.stringify(notebook, null, 2), 'utf-8');
    
    return {
      success: true,
      output: `✓ ${operation}d cell ${cellIdx} in ${notebookPath}\nOld: ${oldContent.slice(0, 100)}${oldContent.length > 100 ? '...' : ''}\nNew: ${newContent.slice(0, 100)}${newContent.length > 100 ? '...' : ''}`,
      cell: cellIdx,
      operation: operation,
      path: notebookPath
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: false, error: `Notebook not found: ${notebookPath}` };
    }
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Invalid JSON in notebook file' };
    }
    return { success: false, error: `Notebook operation failed: ${error.message}` };
  }
}

export const metadata = {
  name: 'notebook',
  description: 'Edit Jupyter notebook cells (replace/insert/delete/add)',
  parameters: ['path', 'cell_index', 'content', 'operation', 'cell_type'],
  requiresApproval: true,
  category: 'notebook'
};
