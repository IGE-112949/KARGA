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
  const { when, setWhen, filters, setFilters, favoriteOf, markFavorite } = useSearch();
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState('');
  const seq = useRef(0);

  // Abre na localização atual (se houver permissão); o botão volta a centrar.
  const locate = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCenter({ latitude: p.coords.latitude + Math.random() * 1e-9, longitude: p.coords.longitude });
    } catch {
      // fica onde está
    }
  };
  useEffect(() => { void locate(); }, []);

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
    markFavorite(s.id, !s.isFavorite);
    try {
      await setFavorite(api, s.id, !s.isFavorite);
    } catch (e) {
      markFavorite(s.id, s.isFavorite);
      setError(e instanceof ApiError ? e.message : 'Não foi possível guardar o favorito.');
    }
  };

  // O favorito pode ter mudado no detalhe ou na página dos favoritos depois da última pesquisa.
  const shown = results.map((x) => ({ ...x, isFavorite: favoriteOf(x.id, x.isFavorite) }));
  const sel = shown.find((r) => r.id === selected) ?? null;
  const open = (id: string) => router.push({ pathname: '/home/space/[id]', params: { id } });

  return (
    <View style={styles.flex}>
      {/* Cabeçalho branco (logo, pesquisa, chips) como no mockup; o mapa começa por baixo. */}
      <SafeAreaView edges={['top']} style={styles.top}>
        <View style={styles.logoRow}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Karga" />
          <Pressable accessibilityRole="button" accessibilityLabel="Ir para a minha localização" onPress={locate} style={styles.locate}>
            <Icon name="locate" size={20} color={theme.colors.text} />
          </Pressable>
        </View>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Icon name="search" size={18} color={theme.colors.textMuted} />
            <TextInput style={styles.input} placeholder="Pesquisar morada ou zona" placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel="Pesquisar morada ou zona" value={query} onChangeText={setQuery} onSubmitEditing={goTo} returnKeyType="search" />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Filtros" onPress={() => setShowFilters(true)} style={styles.filterBtn}>
            <Icon name="sliders" size={20} color={theme.colors.text} />
          </Pressable>
        </View>
        <View style={styles.chips}>
          <QuickChip label="Esta noite" icon="moon" on={filters.tonight} onPress={() => setFilters({ ...filters, tonight: !filters.tonight })} />
          <QuickChip label="Rápido" icon="bolt" on={filters.fast} onPress={() => setFilters({ ...filters, fast: !filters.fast })} />
          <QuickChip label="Coberta" icon="home" on={filters.covered} onPress={() => setFilters({ ...filters, covered: !filters.covered })} />
        </View>
      </SafeAreaView>

      <View style={styles.mapArea}>
      <SpacesMap results={shown} selectedId={selected} onSelect={setSelected} onRegion={setBbox} center={center} initial={LISBON} />
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      <View style={styles.bottom} pointerEvents="box-none">
        {sel ? (
          <ResultCard s={sel} onOpen={() => open(sel.id)} onToggleFavorite={() => toggleFav(sel)} />
        ) : loaded && results.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyText}>Nenhum lugar corresponde a estes filtros.</Text></View>
        ) : null}
      </View>
      </View>

      <FiltersSheet visible={showFilters} when={when} filters={filters} count={loaded ? results.length : null}
        onWhen={setWhen} onFilters={setFilters} onClose={() => setShowFilters(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#EEF1EC' },
  top: { backgroundColor: theme.colors.white, paddingHorizontal: 16, paddingBottom: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border, zIndex: 1 },
  mapArea: { flex: 1, overflow: 'hidden' },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  locate: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', gap: 10 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, borderRadius: 16, backgroundColor: theme.colors.surface, paddingHorizontal: 14 },
  logo: { width: 112, height: 34 },
  input: { flex: 1, fontSize: 15, fontFamily: theme.font.regular, color: theme.colors.text },
  filterBtn: { width: 50, height: 50, borderRadius: 16, backgroundColor: theme.colors.white, borderWidth: 1.5, borderColor: theme.colors.fieldBorder, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.white, borderWidth: 1.5, borderColor: theme.colors.fieldBorder },
  chipOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { fontSize: 14, fontFamily: theme.font.medium, color: theme.colors.text },
  chipTextOn: { color: theme.colors.white },
  error: { position: 'absolute', top: 12, alignSelf: 'center', fontSize: 13, color: theme.colors.danger, fontFamily: theme.font.medium, backgroundColor: theme.colors.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
  bottom: { position: 'absolute', left: 14, right: 14, bottom: 14 },
  empty: { alignSelf: 'center', backgroundColor: theme.colors.white, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, ...theme.shadow.card },
  emptyText: { fontSize: 14, fontFamily: theme.font.medium, color: theme.colors.textLabel },
});
