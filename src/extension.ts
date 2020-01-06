import * as vscode from 'vscode';
import * as fs from 'fs';

function getHeaderFilePath(path: string): string | null {
  if (path.endsWith('-inl.h')) {
    return path.substring(0, path.length - 6) + '.h';
  }
  if (path.endsWith('.h')) {
    return path;
  }
  if (path.endsWith('.cpp')) {
    return path.substring(0, path.length - 4) + '.h';
  }
  return null;
}

function getRelativePath(path: string): string {
  let relativePath = vscode.workspace.asRelativePath(path);
  return relativePath.replace(/\\/g, '/');
}

function shouldUseAngleBrackets(headerPath: string): boolean {
  const prefixes = ['folly'];
  return prefixes.some(prefix => headerPath.startsWith(prefix));
}

function getIncludeString(headerPath: string): string {
  return shouldUseAngleBrackets(headerPath)
    ? `#include <${headerPath}>`
    : `#include "${headerPath}"`;
}

// file:///Documents/foo.h => /Documents/foo.h
function removeFilePrefix(path: string): string {
  const filePrefix = 'file://';
  if (!path.startsWith(filePrefix)) {
    throw new Error(`Expected ${path} to start with ${filePrefix}`);
  }
  return path.substring(filePrefix.length);
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'extension.copyInclude',
    async (uri: string) => {
      if (!uri && vscode.window.activeTextEditor) {
        uri = vscode.window.activeTextEditor.document.uri.toString();
      }
      if (!uri) {
        vscode.window.showErrorMessage(
          'Cannot copy include, no file is opened'
        );
        return;
      }
      const headerPath = getHeaderFilePath(uri);
      if (!headerPath) {
        vscode.window.showErrorMessage(
          'Unable to determine header path: ' + uri
        );
        return;
      }
      if (!fs.existsSync(removeFilePrefix(headerPath))) {
        vscode.window.showErrorMessage('Header not found: ' + headerPath);
        return;
      }
      const relativeHeaderPath = getRelativePath(headerPath);
      const include = getIncludeString(removeFilePrefix(relativeHeaderPath));
      await vscode.env.clipboard.writeText(include);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
