import { analyzeCoursePhoto } from '../src/server/geminiCourseAnalysis';

interface ApiRequest {
  method?: string;
  body?: unknown;
}
interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST')
    return response.status(405).json({ error: 'Méthode non autorisée.' });
  try {
    const body =
      typeof request.body === 'string'
        ? JSON.parse(request.body)
        : request.body;
    const analysis = await analyzeCoursePhoto(body, process.env.GEMINI_API_KEY);
    return response.status(200).json(analysis);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Impossible d’analyser ce cours.';
    const status = message.includes('configurée')
      ? 503
      : message.includes('volumineuse') ||
          message.includes('invalide') ||
          message.includes('reçue')
        ? 400
        : 502;
    return response.status(status).json({ error: message });
  }
}
