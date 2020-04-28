import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'extension.copyInclude',
    async () => {
      const relative = getRelativeFilePath();
      if (!relative) {
        vscode.window.showErrorMessage('No active file');
        return;
      }
      const header = getHeaderFilePath(relative);
      if (!header) {
        vscode.window.showErrorMessage(`Unrecognized C++ file: ${relative}`);
        return;
      }
      const include = getIncludeString(header);
      await vscode.env.clipboard.writeText(include);
    }
  );

  context.subscriptions.push(disposable);
}

function getRelativeFilePath(): string | null {
  const path = vscode.window.activeTextEditor?.document?.uri;
  if (!path) {
    return null;
  }
  const relPath = vscode.workspace.asRelativePath(path);
  const fbcode = 'fbcode/';
  const fbcodeIndex = relPath.indexOf(fbcode);
  if (fbcodeIndex >= 0) {
    return relPath.slice(fbcodeIndex + fbcode.length);
  }
  return relPath;
}

function getHeaderFilePath(path: string): string | null {
  if (path.endsWith('-inl.h')) {
    return `${path.substring(0, path.length - 6)}.h`;
  }
  if (path.endsWith('.h') || path.endsWith('.hpp')) {
    return path;
  }
  if (path.endsWith('.cpp')) {
    return `${path.substring(0, path.length - 4)}.h`;
  }
  return null;
}

function getIncludeString(headerPath: string): string {
  return shouldUseAngleBrackets(headerPath)
    ? `#include <${headerPath}>`
    : `#include "${headerPath}"`;
}

function shouldUseAngleBrackets(headerPath: string): boolean {
  const prefixes = ['folly'];
  return prefixes.some(prefix => headerPath.startsWith(prefix));
}

export function deactivate() { }
