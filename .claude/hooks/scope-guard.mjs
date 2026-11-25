// Claude Code hook: runs before Claude edits or writes a file.
// It blocks edits outside your area (based on your branch name) and edits on main,
// so an agent can't accidentally break someone else's part of the game.
// Exit code 2 = block the edit and show the message to Claude.
import { execSync } from 'node:child_process';
import { relative, resolve } from 'node:path';
import { areaFromBranch, allowed, allowedList, AREAS } from '../../scripts/scope.mjs';

let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let data = {};
  try { data = JSON.parse(input || '{}'); } catch {}
  const file = data.tool_input?.file_path || data.tool_input?.notebook_path;
  if (!file) process.exit(0);

  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const rel = relative(root, resolve(root, file)).split('\\').join('/');
  if (rel.startsWith('..')) process.exit(0); // outside the repo: not our business

  let branch = '';
  try { branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root }).toString().trim(); } catch {}

  if (branch === 'main' || branch === 'master') {
    console.error(`BLOCKED by scope guard: you are on "${branch}". Never edit main directly.\n` +
      `First create a branch for your area: git checkout -b <area>/<short-task> (areas: ${AREAS.join(', ')}).`);
    process.exit(2);
  }
  const area = areaFromBranch(branch);
  if (!area) {
    console.error(`BLOCKED by scope guard: branch "${branch}" doesn't start with an area (${AREAS.map((a) => a + '/').join(', ')}).\n` +
      'Rename it with: git branch -m <area>/<short-task>');
    process.exit(2);
  }
  if (!allowed(area, rel)) {
    console.error(`BLOCKED by scope guard: "${rel}" belongs to another area. The ${area} area may only change: ${allowedList(area).join(', ')}.\n` +
      'Do NOT work around this. Write a GitHub Issue text for the owning area instead (CLAUDE.md rule 1) and show it to the user.');
    process.exit(2);
  }
  process.exit(0);
});
