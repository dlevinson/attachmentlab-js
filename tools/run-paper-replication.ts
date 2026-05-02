import { runPaperReplicationSuite } from '../src/analysis/paperReplication';

const outputRootArgIndex = process.argv.indexOf('--output-root');
const outputRoot = outputRootArgIndex >= 0 ? process.argv[outputRootArgIndex + 1] : undefined;
const resume = process.argv.includes('--resume');
const profile = process.argv.includes('--test')
  ? 'test'
  : process.argv.includes('--smoke')
    ? 'smoke'
    : process.argv.includes('--medium')
      ? 'medium'
      : 'full';
const result = await runPaperReplicationSuite({ profile, outputRoot, resume });
console.log(`Paper replication complete (${profile}). Output: ${result.outputRoot}`);
