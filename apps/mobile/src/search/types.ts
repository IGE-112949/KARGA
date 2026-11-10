import type { SpacePlug, SpaceType } from '@/lib/spaces';

export type SearchResult = {
  id: string; title: string; area: string | null; latitude: number; longitude: number;
  pricePerHour: number; energyPriceKwh: number | null; powerKw: number; plugType: SpacePlug; spaceType: SpaceType;
  coverUrl: string | null; isFavorite: boolean; status?: 'active' | 'inactive';
};

export type Cost = { hours: number; place: number; energyKwh: number; energy: number; serviceFeePercent: number; serviceFee: number; total: number };

export type PublicSpace = SearchResult & {
  photos: { id: string; url: string }[];
  host: { firstName: string; initial: string; avatarUrl: string | null };
  isOwn: boolean;
  available: boolean | null;
  cost: Cost | null;
};
