import path from 'node:path';
import { runBeyondPaperFocused } from '../src/analysis/beyondPaperFocused';

const args = process.argv.slice(2);
let profile: 'test' | 'smoke' | 'medium' | 'full' = 'medium';
let outputRoot: string | undefined;

if (args.includes('--test')) {
  profile = 'test';
} else if (args.includes('--smoke')) {
  profile = 'smoke';
} else if (args.includes('--full')) {
  profile = 'full';
}

const outputIndex = args.findIndex((arg) => arg === '--output-root');
if (outputIndex >= 0 && args[outputIndex + 1]) {
  outputRoot = path.resolve(process.cwd(), args[outputIndex + 1]);
}

runBeyondPaperFocused({ profile, outputRoot })
  .then((result) => {
    console.log(`Beyond-paper focused suite complete (${result.profile}). Output: ${result.outputRoot}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
