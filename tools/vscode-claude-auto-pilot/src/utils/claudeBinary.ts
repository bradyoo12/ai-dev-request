import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Finds the Claude CLI binary path.
 * Checks: VS Code setting > PATH lookup > common install locations.
 */
export function findClaudeBinary(): string {
  // 1. Check VS Code setting
  const configured = vscode.workspace
    .getConfiguration('claudeAutoPilot')
    .get<string>('claudeBinaryPath');
  if (configured && fs.existsSync(configured)) {
    return configured;
  }

  // 2. Try PATH lookup
  try {
    const cmd = process.platform === 'win32' ? 'where.exe claude' : 'which claude';
    const result = cp.execSync(cmd, { encoding: 'utf-8', timeout: 5000 }).trim();
    if (result) {
      const firstLine = result.split('\n')[0].trim();
      if (fs.existsSync(firstLine)) {
        return firstLine;
      }
    }
  } catch {
    // not found in PATH
  }

  // 3. Check common locations
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const commonPaths =
    process.platform === 'win32'
      ? [
          path.join(home, '.claude', 'local', 'claude.exe'),
          path.join(home, 'AppData', 'Local', 'Programs', 'claude', 'claude.exe'),
          path.join(home, '.claude', 'claude.exe'),
        ]
      : [
          '/usr/local/bin/claude',
          path.join(home, '.claude', 'local', 'claude'),
          path.join(home, '.local', 'bin', 'claude'),
        ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error(
    'Claude CLI binary not found. Please install Claude Code CLI or set claudeAutoPilot.claudeBinaryPath in settings.',
  );
}
