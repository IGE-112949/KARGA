import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { defaultWhen, freshWhen, NO_FILTERS, type Filters, type When } from './search';

type Value = {
  when: When; setWhen: (w: When) => void; filters: Filters; setFilters: (f: Filters) => void;
  /** Favorito mudado noutro ecrã (ex.: no detalhe) tem prioridade sobre o que veio na última pesquisa. */
  favoriteOf: (id: string, fromSearch: boolean) => boolean;
  markFavorite: (id: string, on: boolean) => void;
};
const Ctx = createContext<Value | null>(null);

// Janela, filtros e favoritos partilhados entre o mapa, o detalhe do lugar e a página de favoritos.
export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState<When>(() => defaultWhen());
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [favs, setFavs] = useState<Record<string, boolean>>({});
  // De minuto a minuto, para a hora de hoje que entretanto passou avançar sozinha (app aberta muito tempo).
  // Guarda o valor avançado: assim a janela só muda quando passa mesmo (e não a cada minuto, o que repetia pesquisas).
  useEffect(() => {
    const i = setInterval(() => setStored((w) => freshWhen(w)), 60_000);
    return () => clearInterval(i);
  }, []);
  const setWhen = useCallback((w: When) => setStored(freshWhen(w)), []);
  const when = stored;
  const markFavorite = useCallback((id: string, on: boolean) => setFavs((f) => ({ ...f, [id]: on })), []);
  const favoriteOf = useCallback((id: string, fromSearch: boolean) => favs[id] ?? fromSearch, [favs]);
  const value = useMemo(() => ({ when, setWhen, filters, setFilters, favoriteOf, markFavorite }), [when, setWhen, filters, favoriteOf, markFavorite]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSearch(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSearch fora do SearchProvider');
  return v;
}
