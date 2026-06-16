// Decap CMS local proxy with a raised upload limit.
// decap-server hardcodes express.json({ limit: '50mb' }); media travels as
// base64 inside JSON, so videos over ~35 MB made it return an HTML 413 page
// ("<!DOCTYPE ... is not valid JSON"). Parsing the body here first makes the
// inner 50mb parser skip (body-parser ignores already-parsed requests).
import express from 'express';
import middlewares from 'decap-server/dist/middlewares.js';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const app = express();
const port = parseInt(process.env.PORT || '8081', 10);
const repoRoot = process.cwd();
const inlineMediaLimit = parseInt(process.env.INLINE_MEDIA_LIMIT || `${1024 * 1024}`, 10);

app.use(express.json({ limit: process.env.MAX_PAYLOAD || '1gb' }));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && /^https?:\/\/(localhost|127(?:\.\d{1,3}){1,3})(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function resolveInsideRepo(repoPath) {
  const resolved = path.resolve(repoRoot, repoPath);

  if (!resolved.startsWith(repoRoot)) {
    throw new Error('Path must resolve inside the repository');
  }

  return resolved;
}

function getPublicUrl(repoPath) {
  const normalized = normalizePath(repoPath);

  if (normalized.startsWith('public/')) {
    return `/${normalized.slice('public/'.length)}`;
  }

  return `/${normalized}`;
}

function getMediaId(repoPath, stat) {
  return createHash('sha256')
    .update(`${repoPath}:${stat.size}:${stat.mtimeMs}`)
    .digest('hex');
}

function isVideoPath(repoPath) {
  return /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(repoPath);
}

async function serializeMediaFile(repoPath, includeSmallContent = false) {
  const absolutePath = resolveInsideRepo(repoPath);
  const stat = await fs.stat(absolutePath);
  const media = {
    id: getMediaId(repoPath, stat),
    name: path.basename(repoPath),
    path: normalizePath(repoPath),
    displayURL: getPublicUrl(repoPath),
    type: isVideoPath(repoPath) ? 'video' : 'image',
  };

  if (includeSmallContent && stat.size <= inlineMediaLimit) {
    media.content = await fs.readFile(absolutePath, 'base64');
    media.encoding = 'base64';
  }

  return media;
}

app.post('/api/v1', async (req, res, next) => {
  try {
    if (req.body?.action === 'getMedia') {
      const mediaFolder = req.body.params?.mediaFolder;

      if (!mediaFolder) {
        res.status(422).json({ error: '"params.mediaFolder" is required' });
        return;
      }

      const absoluteFolder = resolveInsideRepo(mediaFolder);
      const entries = await fs.readdir(absoluteFolder, { withFileTypes: true });
      const files = entries.filter((entry) => entry.isFile());
      const media = await Promise.all(
        files.map((file) => serializeMediaFile(path.join(mediaFolder, file.name))),
      );

      res.json(media);
      return;
    }

    if (req.body?.action === 'getMediaFile') {
      const mediaPath = req.body.params?.path;

      if (!mediaPath) {
        res.status(422).json({ error: '"params.path" is required' });
        return;
      }

      res.json(await serializeMediaFile(mediaPath, true));
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

await middlewares.registerLocalFs(app);

app.listen(port, () => {
  console.log(`[cms] Decap proxy listening on port ${port} (payload limit ${process.env.MAX_PAYLOAD || '1gb'})`);
});
