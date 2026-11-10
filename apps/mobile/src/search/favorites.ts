import type { Api } from '@/lib/api';

export const setFavorite = (api: Api, spaceId: string, on: boolean) =>
  on ? api.put(`/me/favorites/${spaceId}`, {}) : api.del(`/me/favorites/${spaceId}`);
