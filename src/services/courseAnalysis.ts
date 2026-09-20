import type { CoursePhotoAnalysis } from '@/src/domain/learning';

interface AnalysisContext {
  subjectName?: string;
  titleHint?: string;
}

async function loadImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function prepareImage(file: File) {
  if (!file.type.startsWith('image/'))
    throw new Error('Choisis une photo au format JPEG, PNG ou WebP.');
  const image = await loadImage(file);
  try {
    const maxSide = 1600;
    const scale = Math.min(
      1,
      maxSide / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Impossible de préparer cette photo.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    return {
      imageData: dataUrl.slice(dataUrl.indexOf(',') + 1),
      mimeType: 'image/jpeg',
    };
  } finally {
    URL.revokeObjectURL(image.src);
  }
}

export async function analyzeCourseImage(
  file: File,
  context: AnalysisContext,
): Promise<CoursePhotoAnalysis> {
  const photo = await prepareImage(file);
  const response = await fetch('/api/analyze-course', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...photo, ...context }),
  });
  const result = (await response.json()) as CoursePhotoAnalysis & {
    error?: string;
  };
  if (!response.ok)
    throw new Error(result.error ?? 'Impossible d’analyser cette photo.');
  return result;
}
