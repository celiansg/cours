import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { analyzeCoursePhoto } from './src/server/geminiCourseAnalysis';

function localCourseAnalysisApi(apiKey: string | undefined): Plugin {
  return {
    name: 'tempo-local-course-analysis-api',
    configureServer(server) {
      server.middlewares.use(
        '/api/analyze-course',
        async (request, response) => {
          if (request.method !== 'POST') {
            response.statusCode = 405;
            response.end(JSON.stringify({ error: 'Méthode non autorisée.' }));
            return;
          }
          const chunks: Buffer[] = [];
          request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          request.on('end', async () => {
            response.setHeader('Content-Type', 'application/json');
            response.setHeader('Cache-Control', 'no-store');
            try {
              const body = JSON.parse(
                Buffer.concat(chunks).toString('utf8'),
              ) as unknown;
              const analysis = await analyzeCoursePhoto(body, apiKey);
              response.statusCode = 200;
              response.end(JSON.stringify(analysis));
            } catch (error) {
              response.statusCode = 502;
              response.end(
                JSON.stringify({
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Impossible d’analyser ce cours.',
                }),
              );
            }
          });
        },
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    plugins: [react(), localCourseAnalysisApi(env.GEMINI_API_KEY)],
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    server: { host: '127.0.0.1', port: 3000 },
  };
});
