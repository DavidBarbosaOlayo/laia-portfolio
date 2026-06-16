import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const astroCli = join(process.cwd(), 'node_modules', 'astro', 'astro.js');

for (const command of ['check', 'build']) {
  const result = spawnSync(process.execPath, [astroCli, command], {
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

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
