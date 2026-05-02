import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const sourceRoot = path.join(repoRoot, 'src', 'standalone');
const outputPath = path.join(repoRoot, 'web', 'main.js');

const header = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source files:
// - src/standalone/browser-core.js
// - src/standalone/browser-app.js
// Rebuild with: npm run build:web-standalone

`;

async function main() {
  const [core, app] = await Promise.all([
    fs.readFile(path.join(sourceRoot, 'browser-core.js'), 'utf8'),
    fs.readFile(path.join(sourceRoot, 'browser-app.js'), 'utf8'),
  ]);
  const output = `${header}${core.trimEnd()}\n\n${app.trimStart()}`;
  await fs.writeFile(outputPath, output);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
