export type PlugType = 'type2' | 'schuko' | 'ccs';

export type Vehicle = { id: string; makeModel: string; plate: string; plugType: PlugType; isDefault: boolean };

// Igual ao ProfileDto da API (GET /me).
export type Profile = {
  id: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  isDriver: boolean;
  isHost: boolean;
  termsAcceptedAt: string;
  vehicles: Vehicle[];
};
