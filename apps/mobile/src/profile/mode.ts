export type AppMode = 'driver' | 'host';
type Roles = { isDriver: boolean; isHost: boolean };

export const MODE_KEY = 'karga.mode';

export function initialMode(p: Roles): AppMode {
  return p.isDriver ? 'driver' : 'host';
}

// Modo guardado só vale se o perfil ainda tiver esse papel.
export function resolveMode(stored: string | null, p: Roles): AppMode {
  if (stored === 'driver' && p.isDriver) return 'driver';
  if (stored === 'host' && p.isHost) return 'host';
  return initialMode(p);
}
