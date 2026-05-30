import VSCodeIntegration from '../ide/vscode.js';

export async function execute(args = []) {
  console.log('\n🔧 IDE Integration\n');
  
  const vscode = new VSCodeIntegration();
  const isAvailable = await vscode.isAvailable();
  
  if (!isAvailable) {
    console.log('❌ VS Code not found on this system.');
    console.log('\nInstallation options:');
    console.log('  • macOS: brew install --cask visual-studio-code');
    console.log('  • Windows: Download from https://code.visualstudio.com/');
    console.log('  • Linux: https://code.visualstudio.com/docs/setup/linux\n');
    return;
  }
  
  console.log('✓ VS Code detected\n');
  
  const action = args[0] || 'status';
  
  switch(action) {
    case 'open':
      const filePath = args[1] || '.';
      const result = await vscode.openFolder(filePath);
      if (result.success) {
        console.log(`✓ Opened ${filePath} in VS Code`);
      } else {
        console.log(`❌ Failed to open: ${result.error}`);
      }
      break;
      
    case 'install':
      const extension = args[1];
      if (!extension) {
        console.log('Usage: cod3x ide install <extension-id>');
        console.log('Example: cod3x ide install dbaeumer.vscode-eslint\n');
        return;
      }
      const installResult = await vscode.installExtension(extension);
      if (installResult.success) {
        console.log(`✓ Installed: ${extension}`);
      } else {
        console.log(`❌ Failed to install: ${installResult.error}`);
      }
      break;
      
    case 'extensions':
      const extensions = await vscode.listExtensions();
      if (extensions.success) {
        console.log('Installed extensions:\n');
        for (const ext of extensions.extensions) {
          console.log(`  • ${ext}`);
        }
        console.log(`\nTotal: ${extensions.extensions.length}`);
      }
      break;
      
    case 'recommended':
      console.log('Installing recommended extensions...\n');
      const recResult = await vscode.installRecommendedExtensions();
      console.log(`✓ Installed ${recResult.installed} recommended extensions`);
      break;
      
    case 'status':
    default:
      console.log('Available commands:');
      console.log('  cod3x ide open [path]        - Open folder in VS Code');
      console.log('  cod3x ide install <ext>      - Install extension');
      console.log('  cod3x ide extensions         - List installed extensions');
      console.log('  cod3x ide recommended        - Install recommended extensions');
      console.log('  cod3x ide status             - Show this help\n');
      break;
  }
}

export default { execute };
