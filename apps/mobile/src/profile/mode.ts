export type AppMode = 'driver' | 'host';
type Roles = { isDriver: boolean; isHost: boolean };

// Um modo guardado por conta: duas contas no mesmo telemóvel não partilham o modo.
export const modeKey = (userId: string) => `karga.mode.${userId}`;

export function initialMode(p: Roles): AppMode {
  return p.isDriver ? 'driver' : 'host';
}

// Modo guardado só vale se o perfil ainda tiver esse papel.
export function resolveMode(stored: string | null, p: Roles): AppMode {
  if (stored === 'driver' && p.isDriver) return 'driver';
  if (stored === 'host' && p.isHost) return 'host';
  return initialMode(p);
}
