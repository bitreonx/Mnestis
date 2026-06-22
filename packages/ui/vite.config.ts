import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { workspacePlugin, resolveCliPath, resolveWorkspaceFile } from './vite.workspace';
import { buildAiPackFromDir, aiPackHeaders, parseAiPackQuery } from './vite.ai-pack';

function mnemosStaticPlugin(): Plugin {
  const mnemosRoot = process.env.MNEMOS_ROOT ?? process.cwd();

  return {
    name: 'mnemos-static',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        const jsonMatch = req.url.match(/^\/api\/json\/([^/?]+)/);
        if (jsonMatch && req.method === 'GET') {
          const repoId = jsonMatch[1];
          const { section, mode } = parseAiPackQuery(req.url);
          const mnemosDir = path.join(mnemosRoot, '.mnemos');
          const { body, status } = await buildAiPackFromDir(mnemosDir, {
            repoId,
            root: mnemosRoot,
            section,
            mode,
          });
          res.statusCode = status;
          for (const [k, v] of Object.entries(aiPackHeaders())) res.setHeader(k, v);
          res.end(body);
          return;
        }

        if (!req.url.startsWith('/.mnemos/')) return next();
        if (req.url.match(/^\/\.mnemos\/[^/]+\//)) return next();

        const filePath = path.join(mnemosRoot, req.url);
        if (!existsSync(filePath)) {
          // Fall through so Vite can serve a bundled copy from public/.mnemos/.
          // This keeps dev behavior identical to the static (Vercel) deploy.
          return next();
        }

        try {
          const content = await readFile(filePath, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(content);
        } catch {
          res.statusCode = 500;
          res.end('Error reading file');
        }
      });
    },
  };
}

const workspaceFile = resolveWorkspaceFile();
const plugins: Plugin[] = [react(), tailwindcss(), mnemosStaticPlugin()];
if (workspaceFile) {
  plugins.push(workspacePlugin(workspaceFile, resolveCliPath()));
}

export default defineConfig({
  plugins,
  server: {
    port: 5173,
    fs: {
      allow: ['..', '../..', '../../..', '../../../..', 'D:/Dabt', 'D:/Mnemos'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@mnestis/core/search': path.resolve(__dirname, '../core/src/search/index.ts'),
      '@mnestis/core/copilot': path.resolve(__dirname, '../core/src/copilot.ts'),
    },
  },
});
