// PR check: fails if a pull request changes files outside its area.
// The area comes from the branch name (world/..., build/..., social/..., activities/..., core/...).
// Run locally: node scripts/check-scope.mjs   (compares your branch with main)
import { execSync } from 'node:child_process';
import { areaFromBranch, allowed, allowedList, AREAS } from './scope.mjs';

const branch = process.env.HEAD_REF || execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const base = process.env.BASE_SHA || 'origin/main';
const area = areaFromBranch(branch);

if (!area) {
  console.error(`❌ Branch "${branch}" must start with one of: ${AREAS.map((a) => a + '/').join(', ')}`);
  console.error('   Example: world/better-walking. Rename it with: git branch -m <new-name>');
  process.exit(1);
}

const files = execSync(`git diff --name-only ${base}...HEAD`).toString().split('\n').filter(Boolean);
const outside = files.filter((f) => !allowed(area, f));
console.log(`Area: ${area} · ${files.length} changed file(s)`);
if (outside.length) {
  console.error(`❌ These files are outside the ${area} area:`);
  for (const f of outside) console.error('   - ' + f);
  console.error(`   ${area} may change: ${allowedList(area).join(', ')}`);
  console.error('   Move those changes into a GitHub Issue for the right area (see CLAUDE.md rule 1).');
  process.exit(1);
}
console.log('✅ All changes are inside the area.');
