import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
  console.log('CodeFactory extension activated');

  // Sync command - context-aware syncing
  // If a file is active, sync that file (or all files using that factory if it's a .hbs/.template)
  // If no file is active, sync the entire src/ directory
  const syncCommand = vscode.commands.registerCommand('codefactory.sync', async () => {
    const editor = vscode.window.activeTextEditor;
    
    if (editor) {
      // Active file - sync it (CLI will handle factory detection automatically)
      const filePath = editor.document.uri.fsPath;
      await runCodefactorySync(filePath);
    } else {
      // No active file - sync entire project
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }
      
      const srcPath = path.join(workspaceFolder.uri.fsPath, 'src');
      await runCodefactorySync(srcPath);
    }
  });

  context.subscriptions.push(syncCommand);
}

async function runCodefactorySync(targetPath: string): Promise<void> {
  // Get workspace root for working directory
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }
  
  const command = `codefactory sync "${targetPath}"`;
  
  return vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'CodeFactory',
    cancellable: false
  }, async (progress) => {
    progress.report({ message: 'Running sync...' });
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workspaceFolder.uri.fsPath
      });
      
      if (stderr) {
        console.error('CodeFactory stderr:', stderr);
      }
      
      if (stdout) {
        console.log('CodeFactory output:', stdout);
      }
      
      vscode.window.showInformationMessage('✅ Sync complete!');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`❌ Sync failed: ${message}`);
      throw error;
    }
  });
}

export function deactivate() {}
