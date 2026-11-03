#!/usr/bin/env node
// Starts the trail-rec tools for Claude: finds the trail-rec CLI installed on this
// computer (by https://trail.ariff.ai/install.sh) and runs `trail-rec mcp`, an MCP
// server over stdio. The plugin runs nothing else, and this file downloads nothing.
//
// If trail-rec isn't installed yet, this answers as a small MCP server of its own
// with one tool, setup_check, that says how to install it. Once it's installed, the
// next message starts the real one and passes everything through, so the person
// doesn't have to restart anything.
import { spawn } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';

const INSTALL = 'curl -fsSL https://trail.ariff.ai/install.sh | sh';
const NODE_MAJOR = Number(process.versions.node.split('.')[0]);

/** The installed CLI: TRAIL_REC_CLI, the install folder, ~/.local/bin, or the PATH. */
function findCli() {
  const dirs = [process.env.TRAIL_REC_INSTALL_DIR, path.join(homedir(), '.local/bin'), ...(process.env.PATH ?? '').split(path.delimiter)];
  const candidates = [process.env.TRAIL_REC_CLI, ...dirs.filter(Boolean).map((d) => path.join(d, 'trail-rec'))];
  for (const file of candidates) {
    if (!file) continue;
    try {
      accessSync(file, constants.X_OK);
      return file;
    } catch {
      // not there
    }
  }
  return null;
}

/** Runs `trail-rec mcp` with this same Node (apps may start us without the shell's PATH). */
function startCli(cli, stdio) {
  return spawn(process.execPath, [cli, 'mcp'], { stdio });
}

const cli = NODE_MAJOR >= 20 ? findCli() : null;
if (cli) {
  // The usual case: become trail-rec mcp.
  const child = startCli(cli, 'inherit');
  child.on('exit', (code, signal) => (signal ? process.kill(process.pid, signal) : process.exit(code ?? 0)));
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
} else {
  waitForInstall();
}

function waitForInstall() {
  const why =
    NODE_MAJOR < 20
      ? `trail-rec needs Node 20 or newer, and this is Node ${process.versions.node}. Ask the user to install a newer Node (https://nodejs.org), then run this in Terminal: ${INSTALL}`
      : `trail-rec isn't installed on this computer yet. Ask the user to open Terminal and run: ${INSTALL} — it puts one file in ~/.local/bin. Then call setup_check again. (In Claude Code you can run that line yourself, if the user agrees.)`;
  const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
  let initialize = null; // the client's initialize request, replayed to the real server
  let child = null;
  let queue = null; // lines from the client while the real server starts, in order

  const lines = createInterface({ input: process.stdin });
  lines.on('line', (line) => {
    if (child) return queue ? queue.push(line) : child.stdin.write(line + '\n');
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    if (msg.method === 'initialize') initialize = msg;
    // Installed since we started? Hand over to it.
    const found = NODE_MAJOR >= 20 && initialize && msg.method !== 'initialize' ? findCli() : null;
    if (found) return handOver(found, line);
    if (msg.id === undefined || msg.id === null) return; // notifications
    const reply = (result) => send({ jsonrpc: '2.0', id: msg.id, result });
    switch (msg.method) {
      case 'initialize':
        return reply({
          protocolVersion: msg.params?.protocolVersion ?? '2025-06-18',
          capabilities: { tools: { listChanged: true } },
          serverInfo: { name: 'trail-rec', version: '0' },
          instructions: why,
        });
      case 'ping':
        return reply({});
      case 'tools/list':
        return reply({
          tools: [
            {
              name: 'setup_check',
              title: 'Check trail-rec setup',
              description: 'Check whether trail-rec is set up on this computer, and say what to do if it isn’t. Call it before driving or recording Chrome.',
              inputSchema: { type: 'object', properties: {} },
              annotations: { title: 'Check trail-rec setup', readOnlyHint: true, openWorldHint: false },
            },
          ],
        });
      case 'tools/call':
        return reply({ content: [{ type: 'text', text: why }], isError: msg.params?.name !== 'setup_check' });
      default:
        return send({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: `Method not found: ${msg.method}` } });
    }
  });
  lines.on('close', () => (child ? child.stdin.end() : process.exit(0)));

  /** Starts the real server, replays the handshake, then passes every line both ways. */
  function handOver(found, pending) {
    child = startCli(found, ['pipe', 'pipe', 'inherit']);
    queue = [pending];
    const out = createInterface({ input: child.stdout });
    out.on('line', (line) => {
      if (queue) {
        // The answer to the replayed initialize is ours, not the client's: swallow it,
        // send what the client sent meanwhile, and tell it the tools changed so it
        // lists them again.
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
        for (const queued of queue) child.stdin.write(queued + '\n');
        queue = null;
        return send({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
      }
      process.stdout.write(line + '\n');
    });
    child.on('exit', (code) => process.exit(code ?? 0));
    child.stdin.write(JSON.stringify(initialize) + '\n');
  }
}
