import path from 'node:path';
import { runPaperReplicationSuite } from '../src/analysis/paperReplication';
import { runFullModelSuite } from '../src/analysis/fullModelSuite';

const profile = process.argv.includes('--smoke')
  ? 'smoke'
  : process.argv.includes('--medium')
    ? 'medium'
    : 'full';

const repoRoot = process.cwd();
const baseOutputRoot = path.join(
  repoRoot,
  'results',
  `research_program_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${profile}`,
);

console.log(`[research] starting combined program profile=${profile}`);

const paperResult = await runPaperReplicationSuite({
  profile: profile === 'full' ? 'full' : profile === 'medium' ? 'medium' : 'smoke',
  outputRoot: path.join(baseOutputRoot, 'paper_replication'),
});

const fullModelResult = await runFullModelSuite({
  profile,
  outputRoot: path.join(baseOutputRoot, 'full_model_suite'),
});

console.log(`[research] complete profile=${profile}`);
console.log(`[research] paper output: ${paperResult.outputRoot}`);
console.log(`[research] full-model output: ${fullModelResult.outputRoot}`);
