import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index < 0) {
    return undefined;
  }
  return process.argv[index + 1];
}

const profile = process.argv.includes('--test')
  ? 'test'
  : process.argv.includes('--smoke')
    ? 'smoke'
    : process.argv.includes('--medium')
      ? 'medium'
      : 'full';
const outputRoot = readArg('--output-root') ?? path.join(process.cwd(), 'results', `paper_replication_detached_${new Date().toISOString().slice(0, 10).replaceAll('-', '')}_${profile}`);
const resume = process.argv.includes('--resume');

fs.mkdirSync(outputRoot, { recursive: true });

const logPath = path.join(outputRoot, 'paper_replication.log');
const launchPath = path.join(outputRoot, 'launch.json');
const stdoutFd = fs.openSync(logPath, 'a');
const stderrFd = fs.openSync(logPath, 'a');

const args = ['run', 'analyze:paper', '--', '--output-root', outputRoot];
if (resume) {
  args.push('--resume');
}
if (profile !== 'full') {
  args.push(`--${profile}`);
}

const child = spawn('npm', args, {
  cwd: process.cwd(),
  detached: true,
  stdio: ['ignore', stdoutFd, stderrFd],
});

child.unref();

fs.writeFileSync(
  launchPath,
  JSON.stringify(
    {
      launchedAt: new Date().toISOString(),
      pid: child.pid,
      cwd: process.cwd(),
      outputRoot,
      logPath,
      profile,
      resume,
      command: ['npm', ...args],
    },
    null,
    2,
  ),
);

console.log(JSON.stringify({ outputRoot, logPath, launchPath, pid: child.pid }, null, 2));
