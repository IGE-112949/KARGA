import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/auth/AuthProvider';
import { modeKey, resolveMode, type AppMode } from './mode';

const ModeContext = createContext<{ mode: AppMode; setMode: (m: AppMode) => void } | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [stored, setStored] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const userId = profile?.id;
  useEffect(() => {
    if (!userId) return;
    setLoaded(false);
    AsyncStorage.getItem(modeKey(userId)).then(setStored).catch(() => undefined).finally(() => setLoaded(true));
  }, [userId]);

  const setMode = useCallback((m: AppMode) => {
    setStored(m);
    if (userId) AsyncStorage.setItem(modeKey(userId), m).catch(() => undefined);
  }, [userId]);

  // Só mostra os separadores quando o modo está decidido: senão o separador do outro modo começa escondido
  // e o router salta para outro ecrã (ex.: abrir /spaces ia parar a /home).
  if (!loaded || !profile) return null;
  const mode = resolveMode(stored, profile);
  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const v = useContext(ModeContext);
  if (!v) throw new Error('useMode fora do ModeProvider');
  return v;
}
