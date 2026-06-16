import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const prerender = true;

export function GET() {
  const config = readFileSync(join(process.cwd(), 'public', 'admin', 'config.yml'), 'utf-8');

  return new Response(config, {
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
    },
  });
}
