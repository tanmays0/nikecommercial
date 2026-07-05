/**
 * ARCHIVE dev server — single port, kill stale listeners before start.
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'dev.config.json'), 'utf8'));
const PORT = Number(process.env.PORT || CONFIG.port || 55333);
const HOST = process.env.HOST || CONFIG.host || '127.0.0.1';

function killListenersOnPort(port) {
  if (process.platform === 'win32') {
    try {
      const out = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
      const pids = new Set();
      for (const line of out.split('\n')) {
        if (!line.includes('LISTENING')) continue;
        if (!line.includes(`:${port} `) && !line.includes(`:${port}\r`)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = Number(parts[parts.length - 1]);
        if (pid > 0) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`[dev] Freed port ${port} (stopped PID ${pid})`);
        } catch (_) {
          /* already gone */
        }
      }
    } catch (_) {
      /* nothing listening */
    }
    return;
  }

  try {
    execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, { stdio: 'ignore', shell: true });
    console.log(`[dev] Freed port ${port}`);
  } catch (_) {
    /* nothing listening */
  }
}

killListenersOnPort(PORT);

console.log(`\n  ARCHIVE dev server`);
console.log(`  http://${HOST}:${PORT}/\n`);

const serveBin = path.join(ROOT, 'node_modules', 'serve', 'build', 'main.js');

const child = spawn(process.execPath, [serveBin, '-l', String(PORT)], {
  cwd: ROOT,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
