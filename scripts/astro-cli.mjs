import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const astroCli = join(process.cwd(), 'node_modules', 'astro', 'astro.js');

const result = spawnSync(process.execPath, [astroCli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: false,
  env: {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: '1',
  },
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
