import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'portfolio-analysis-'));
const snapshot = join(temporary, 'snapshot');

try {
  // Analyze HEAD so unfinished edits never become fake 0000000 commit links.
  execFileSync('git', ['clone', '--quiet', '--local', '--no-hardlinks', root, snapshot]);
  await mkdir(resolve(root, 'meta'), { recursive: true });
  execFileSync(process.execPath, [
    resolve(root, 'node_modules/elocuent/src/cli.js'),
    '-d', '.', '-o', resolve(root, 'meta/loc.csv'), '--spaces', '2',
  ], { cwd: snapshot, stdio: 'inherit' });
} finally {
  await rm(temporary, { recursive: true, force: true });
}
