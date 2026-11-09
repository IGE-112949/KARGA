import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/auth/AuthProvider';
import { MODE_KEY, resolveMode, type AppMode } from './mode';

const ModeContext = createContext<{ mode: AppMode; setMode: (m: AppMode) => void } | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [stored, setStored] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY).then(setStored).catch(() => undefined);
  }, []);

  const setMode = useCallback((m: AppMode) => {
    setStored(m);
    AsyncStorage.setItem(MODE_KEY, m).catch(() => undefined);
  }, []);

  const mode = resolveMode(stored, profile ?? { isDriver: true, isHost: false });
  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const v = useContext(ModeContext);
  if (!v) throw new Error('useMode fora do ModeProvider');
  return v;
}
