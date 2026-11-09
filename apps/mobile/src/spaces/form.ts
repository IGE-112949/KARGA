import { filePart } from '@/lib/avatar';

// Corpo multipart de POST /me/spaces: "data" (JSON) + "photos" (1–5).
export async function spaceFormData(data: unknown, photos: { uri: string }[]): Promise<FormData> {
  const form = new FormData();
  form.append('data', JSON.stringify(data));
  for (let i = 0; i < photos.length; i++) form.append('photos', await filePart(photos[i].uri, `foto-${i + 1}.jpg`), `foto-${i + 1}.jpg`);
  return form;
}

export async function photoFormData(uri: string): Promise<FormData> {
  const form = new FormData();
  form.append('file', await filePart(uri, 'foto.jpg'), 'foto.jpg');
  return form;
}
