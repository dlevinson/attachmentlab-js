import { runBeyondPaperSuite } from '../src/analysis/beyondPaperSuite';

const profile = process.argv.includes('--smoke')
  ? 'smoke'
  : process.argv.includes('--medium')
    ? 'medium'
    : process.argv.includes('--test')
      ? 'test'
    : 'full';
const result = await runBeyondPaperSuite({ profile });
console.log(`Beyond-paper suite complete (${profile}). Output: ${result.outputRoot}`);
