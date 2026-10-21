import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Always deploy an isolated copy linked to this exact staging project.
// Never read or modify the checkout's normal .vercel project link.
const project = {
  projectId: 'prj_P49aBZHtjIIEA1ndDNu4QIo4KIhz',
  orgId: 'team_geC3kBz8y0GaZDNAAGOnfIxg',
  projectName: 'cipherpay-staging',
};
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = mkdtempSync(path.join(tmpdir(), 'cipherpay-staging-deploy-'));
const excluded = new Set(['.git', '.vercel', '.next', 'node_modules', '.agents', '.codex']);
cpSync(source, target, {
  recursive: true,
  filter: file => {
    const name = path.basename(file);
    return !excluded.has(name) && !name.startsWith('.env') && !name.endsWith('.tsbuildinfo');
  },
});
mkdirSync(path.join(target, '.vercel'));
writeFileSync(path.join(target, '.vercel/project.json'), JSON.stringify(project));
console.log(`Deploying only ${project.projectName} (${project.projectId}) from ${target}`);
// --prod selects the stable alias of the dedicated staging project.
const result = spawnSync('npx', [
  '--yes', '--cache', '/private/tmp/cipherpay-npm-cache', 'vercel@62.2.0',
  'deploy', '--prod', '--yes', '--scope', project.orgId, '--cwd', target,
], {
  stdio: 'inherit',
  env: { ...process.env, VERCEL_PROJECT_ID: project.projectId, VERCEL_ORG_ID: project.orgId },
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
