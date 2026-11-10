import { createContext, useContext, useMemo, useState } from 'react';
import { defaultWhen, NO_FILTERS, type Filters, type When } from './search';

type Value = { when: When; setWhen: (w: When) => void; filters: Filters; setFilters: (f: Filters) => void };
const Ctx = createContext<Value | null>(null);

// Janela e filtros partilhados entre o mapa e o detalhe do lugar.
export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [when, setWhen] = useState<When>(() => defaultWhen());
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const value = useMemo(() => ({ when, setWhen, filters, setFilters }), [when, filters]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSearch(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSearch fora do SearchProvider');
  return v;
}
