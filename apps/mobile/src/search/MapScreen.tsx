import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '@/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import { geocodeAddress, LISBON, type LatLng } from '@/lib/location';
import { Icon, type IconName } from '@/ui/Icon';
import { theme } from '@/theme';
import { useSearch } from './SearchContext';
import { searchQuery, toQueryString, type Bbox } from './search';
import { SpacesMap } from './SpacesMap';
import { FiltersSheet } from './FiltersSheet';
import { ResultCard } from './ResultCard';
import { setFavorite } from './favorites';
import type { SearchResult } from './types';

export const SEARCH_DEBOUNCE_MS = 500;

function QuickChip({ label, icon, on, onPress }: { label: string; icon: IconName; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: on }} onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Icon name={icon} size={16} color={on ? theme.colors.white : theme.colors.text} />
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function MapScreen() {
  const router = useRouter();
  const { api } = useAuth();
  const { when, setWhen, filters, setFilters } = useSearch();
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState('');
  const seq = useRef(0);

  // Abre na localização atual (se houver permissão).
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCenter({ latitude: p.coords.latitude, longitude: p.coords.longitude });
      } catch {
        // fica em Lisboa
      }
    })();
  }, []);

  // Pesquisa 0,5 s depois de o mapa parar ou de mudarem os filtros; respostas antigas são ignoradas.
  useEffect(() => {
    if (!bbox) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const r = await api.get<SearchResult[]>(`/spaces/search?${toQueryString(searchQuery(bbox, when, filters))}`);
        if (id !== seq.current) return;
        setResults(r);
        setError(null);
        setLoaded(true);
        setSelected((cur) => (cur && r.some((x) => x.id === cur) ? cur : null));
      } catch (e) {
        if (id === seq.current) setError(e instanceof ApiError ? e.message : 'Não foi possível pesquisar.');
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [api, bbox, when, filters]);

  const goTo = async () => {
    const q = query.trim();
    if (q.length < 3) return;
    try {
      const p = await geocodeAddress(q);
      if (p) setCenter(p);
      else setError('Não encontrámos essa morada ou zona.');
    } catch {
      setError('Sem acesso à localização para pesquisar moradas.');
    }
  };

  const toggleFav = async (s: SearchResult) => {
    setResults((rs) => rs.map((x) => (x.id === s.id ? { ...x, isFavorite: !s.isFavorite } : x)));
    try {
      await setFavorite(api, s.id, !s.isFavorite);
    } catch (e) {
      setResults((rs) => rs.map((x) => (x.id === s.id ? { ...x, isFavorite: s.isFavorite } : x)));
      setError(e instanceof ApiError ? e.message : 'Não foi possível guardar o favorito.');
    }
  };

  const sel = results.find((r) => r.id === selected) ?? null;
  const open = (id: string) => router.push({ pathname: '/home/space/[id]', params: { id } });

  return (
    <View style={styles.flex}>
      <SpacesMap results={results} selectedId={selected} onSelect={setSelected} onRegion={setBbox} center={center} initial={LISBON} />
      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Karga" />
            <Icon name="search" size={18} color={theme.colors.textMuted} />
            <TextInput style={styles.input} placeholder="Pesquisar morada ou zona" placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel="Pesquisar morada ou zona" value={query} onChangeText={setQuery} onSubmitEditing={goTo} returnKeyType="search" />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Filtros" onPress={() => setShowFilters(true)} style={styles.filterBtn}>
            <Icon name="sliders" size={20} color={theme.colors.white} />
          </Pressable>
        </View>
        <View style={styles.chips}>
          <QuickChip label="Esta noite" icon="moon" on={filters.tonight} onPress={() => setFilters({ ...filters, tonight: !filters.tonight })} />
          <QuickChip label="Rápido" icon="bolt" on={filters.fast} onPress={() => setFilters({ ...filters, fast: !filters.fast })} />
          <QuickChip label="Coberta" icon="home" on={filters.covered} onPress={() => setFilters({ ...filters, covered: !filters.covered })} />
        </View>
        {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      </SafeAreaView>

      <View style={styles.bottom} pointerEvents="box-none">
        {sel ? (
          <ResultCard s={sel} onOpen={() => open(sel.id)} onToggleFavorite={() => toggleFav(sel)} />
        ) : loaded && results.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Nenhum lugar corresponde a estes filtros.</Text></View>
        ) : null}
      </View>

      <FiltersSheet visible={showFilters} when={when} filters={filters} count={loaded ? results.length : null}
        onWhen={setWhen} onFilters={setFilters} onClose={() => setShowFilters(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#EEF1EC' },
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 14, gap: 10 },
  searchRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, borderRadius: 18, backgroundColor: theme.colors.white, paddingHorizontal: 14, ...theme.shadow.card },
  logo: { width: 26, height: 26 },
  input: { flex: 1, fontSize: 15, fontFamily: theme.font.regular, color: theme.colors.text },
  filterBtn: { width: 52, height: 52, borderRadius: 18, backgroundColor: theme.colors.navy, alignItems: 'center', justifyContent: 'center', ...theme.shadow.card },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.white, ...theme.shadow.card },
  chipOn: { backgroundColor: theme.colors.accent },
  chipText: { fontSize: 14, fontFamily: theme.font.medium, color: theme.colors.text },
  chipTextOn: { color: theme.colors.white },
  error: { alignSelf: 'center', fontSize: 13, color: theme.colors.danger, fontFamily: theme.font.medium, backgroundColor: theme.colors.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
  bottom: { position: 'absolute', left: 14, right: 14, bottom: 14 },
  empty: { alignSelf: 'center', backgroundColor: theme.colors.white, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, ...theme.shadow.card },
  emptyText: { fontSize: 14, fontFamily: theme.font.medium, color: theme.colors.textLabel },
});
