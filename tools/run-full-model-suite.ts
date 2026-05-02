import { runFullModelSuite } from '../src/analysis/fullModelSuite';

const profile = process.argv.includes('--smoke')
  ? 'smoke'
  : process.argv.includes('--medium')
    ? 'medium'
    : 'full';
const result = await runFullModelSuite({ profile });
console.log(`Full model suite complete (${profile}). Output: ${result.outputRoot}`);
