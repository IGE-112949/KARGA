import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import { formatEnergy, formatEuro, formatKw, plugLabelOf, spaceTypeLabel } from '@/lib/spaces';
import { Avatar } from '@/ui/Avatar';
import { Icon, type IconName } from '@/ui/Icon';
import { theme } from '@/theme';
import { useSearch } from '@/search/SearchContext';
import { effectiveWhen, toQueryString, whenLabel, windowQuery } from '@/search/search';
import { WhenPicker } from '@/search/WhenPicker';
import { setFavorite } from '@/search/favorites';
import type { PublicSpace } from '@/search/types';

const num = (v: number, d = 1) => String(Number(v.toFixed(d))).replace('.', ',');

function Tile({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={styles.tile}>
      <Icon name={icon} size={20} color={theme.colors.link} />
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function Round({ icon, label, onPress, on }: { icon: IconName; label: string; onPress: () => void; on?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={on === undefined ? undefined : { selected: on }}
      onPress={onPress} hitSlop={6} style={styles.round}>
      <Icon name={icon} size={20} color={on ? '#E11D48' : theme.colors.text} filled={!!on} />
    </Pressable>
  );
}

export default function SpaceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useAuth();
  const { when, setWhen, filters, setFilters } = useSearch();
  const { width } = useWindowDimensions();
  const [s, setS] = useState<PublicSpace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const seq = useRef(0);
  const w = effectiveWhen(when, filters);

  useEffect(() => {
    const n = ++seq.current;
    api.get<PublicSpace>(`/spaces/${id}?${toQueryString(windowQuery(when, filters))}`)
      .then((r) => { if (n === seq.current) { setS(r); setError(null); } })
      .catch((e) => {
        if (n !== seq.current) return;
        setError(e instanceof ApiError && e.status === 404 ? 'Este lugar já não está disponível.' : e instanceof ApiError ? e.message : 'Ocorreu um erro.');
      });
  }, [api, id, when, filters]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  if (!s) {
    return (
      <SafeAreaView style={styles.center}>
        <View style={styles.topRow}><Round icon="back" label="Voltar" onPress={back} /></View>
        {error ? <Text style={styles.muted}>{error}</Text> : <ActivityIndicator color={theme.colors.accent} />}
      </SafeAreaView>
    );
  }

  const toggleFav = async () => {
    const on = !s.isFavorite;
    setS({ ...s, isFavorite: on });
    try { await setFavorite(api, s.id, on); } catch { setS((x) => (x ? { ...x, isFavorite: !on } : x)); }
  };
  const share = () => Share.share({
    message: `${s.title} · ${formatEuro(s.pricePerHour)}/h · ${s.area ?? ''} — vê na Karga: ${Linking.createURL(`/home/space/${s.id}`)}`,
  }).catch(() => undefined);

  const c = s.cost;
  const photos = s.photos.length ? s.photos : [{ id: 'none', url: '' }];

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ height: 280 }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {photos.map((p) => (
              <View key={p.id} style={{ width, height: 280, backgroundColor: '#E2E7E2' }}>
                {p.url ? <Image source={{ uri: p.url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
              </View>
            ))}
          </ScrollView>
          <SafeAreaView edges={['top']} style={styles.overlay} pointerEvents="box-none">
            <View style={styles.topRow}>
              <Round icon="back" label="Voltar" onPress={back} />
              <View style={styles.actions}>
                <Round icon="share" label="Partilhar" onPress={share} />
                {!s.isOwn ? <Round icon="heart" label={s.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} on={s.isFavorite} onPress={toggleFav} /> : null}
              </View>
            </View>
          </SafeAreaView>
          <Text style={styles.counter}>{`${page + 1} / ${photos.length}`}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.h1} accessibilityRole="header">{s.title}</Text>
          <View style={styles.line}><Icon name="map" size={16} color={theme.colors.textMuted} /><Text style={styles.muted}>{s.area}</Text></View>
          <Text style={styles.small}>A morada exata é mostrada depois de reservares.</Text>

          <View style={styles.host}>
            <Avatar uri={s.host.avatarUrl} name={`${s.host.firstName} ${s.host.initial}`} size={44} />
            <View style={styles.flex}>
              <Text style={styles.hostName}>{`${s.host.firstName} ${s.host.initial}${s.host.initial ? '.' : ''}`}</Text>
              <Text style={styles.small}>Novo na Karga · sem avaliações</Text>
            </View>
          </View>

          <View style={styles.tiles}>
            <Tile icon="bolt" value={formatKw(s.powerKw)} label="Potência" />
            <Tile icon="swap" value={plugLabelOf(s.plugType)} label="Ficha" />
            <Tile icon="home" value={spaceTypeLabel(s.spaceType)} label="Tipo de lugar" />
            <Tile icon="wallet" value={s.energyPriceKwh == null ? 'Não incluída' : `${formatEnergy(s.energyPriceKwh)}/kWh`} label="Energia (custo)" />
          </View>

          <Text style={styles.h2}>Quando precisas do lugar?</Text>
          <WhenPicker when={w} onChange={(nw) => { setWhen(nw); if (filters.tonight) setFilters({ ...filters, tonight: false }); }} />
          <View style={styles.availRow}>
            <Text style={styles.small}>{whenLabel(w)}</Text>
            <Text style={[styles.pill, s.available ? styles.pillOk : styles.pillNo]}>{s.available ? 'Disponível' : 'Indisponível nesta janela'}</Text>
          </View>

          {c ? (
            <>
              <Text style={styles.h2}>Resumo de custos (estimado)</Text>
              <View style={styles.card}>
                <View style={styles.costRow}><Text style={styles.muted}>{`Lugar (${formatEuro(s.pricePerHour)} × ${c.hours} h)`}</Text><Text style={styles.costV}>{formatEuro(c.place)}</Text></View>
                <View style={styles.costRow}>
                  <Text style={styles.muted}>{s.energyPriceKwh == null ? 'Energia (não incluída)' : `Energia (≈ ${num(c.energyKwh)} kWh × ${formatEnergy(s.energyPriceKwh)})`}</Text>
                  <Text style={styles.costV}>{formatEuro(c.energy)}</Text>
                </View>
                <View style={styles.costRow}><Text style={styles.muted}>{`Taxa de serviço (${num(c.serviceFeePercent, 0)}%)`}</Text><Text style={styles.costV}>{formatEuro(c.serviceFee)}</Text></View>
                <View style={[styles.costRow, styles.totalRow]}><Text style={styles.total}>Total estimado</Text><Text style={styles.total}>{formatEuro(c.total)}</Text></View>
              </View>
            </>
          ) : null}

          <View style={styles.note}><Icon name="info" size={18} color={theme.colors.link} /><Text style={styles.noteText}>A energia é cobrada ao preço de custo do proprietário, pelos kWh realmente medidos pela tomada. O proprietário ganha com o aluguer do lugar, não com a energia.</Text></View>
          <View style={styles.note}><Icon name="clock" size={18} color={theme.colors.link} /><Text style={styles.noteText}>Se o carro ficar no lugar depois da hora de fim, aplica-se uma taxa de ocupação de 0,10 €/min.</Text></View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bar}>
        <View style={styles.flex}>
          <Text style={styles.small}>Total estimado</Text>
          <Text style={styles.barTotal}>{c ? formatEuro(c.total) : '—'}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Reservar (em breve)" accessibilityState={{ disabled: true }} disabled style={styles.reserve}>
          <Text style={styles.reserveText}>Reservar</Text>
          <Text style={styles.soon}>Em breve</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: theme.colors.screenBg },
  scroll: { paddingBottom: 120, backgroundColor: theme.colors.screenBg },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, alignSelf: 'stretch' },
  actions: { flexDirection: 'row', gap: 10 },
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', ...theme.shadow.card },
  counter: { position: 'absolute', right: 16, bottom: 14, fontSize: 12, fontFamily: theme.font.semibold, color: theme.colors.white, backgroundColor: 'rgba(19,38,58,0.7)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  body: { padding: 20, gap: 12 },
  h1: { fontSize: 26, fontFamily: theme.font.bold, color: theme.colors.text },
  h2: { fontSize: 18, fontFamily: theme.font.semibold, color: theme.colors.text, marginTop: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  muted: { flexShrink: 1, fontSize: 15, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  small: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  host: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border },
  hostName: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.colors.text },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '47%', flexGrow: 1, padding: 12, borderRadius: 16, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, gap: 2 },
  tileValue: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.colors.text, marginTop: 4 },
  tileLabel: { fontSize: 12, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  availRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  pill: { fontSize: 13, fontFamily: theme.font.semibold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  pillOk: { backgroundColor: theme.colors.greenBg, color: theme.colors.greenText },
  pillNo: { backgroundColor: '#FDECEC', color: theme.colors.danger },
  card: { borderRadius: 18, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
  costV: { fontSize: 15, fontFamily: theme.font.medium, color: theme.colors.text },
  totalRow: { borderBottomWidth: 0 },
  total: { fontSize: 16, fontFamily: theme.font.bold, color: theme.colors.text },
  note: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: theme.colors.greenBg },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18, color: theme.colors.greenText, fontFamily: theme.font.regular },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border },
  barTotal: { fontSize: 20, fontFamily: theme.font.bold, color: theme.colors.text },
  reserve: { height: 52, paddingHorizontal: 26, borderRadius: 16, backgroundColor: theme.colors.accent, opacity: 0.5, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  reserveText: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.colors.white },
  soon: { fontSize: 11, fontFamily: theme.font.medium, color: theme.colors.white },
});
