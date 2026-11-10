import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatEuro } from '@/lib/spaces';
import type { LatLng } from '@/lib/location';
import { theme } from '@/theme';
import type { Bbox } from './search';
import type { SearchResult } from './types';

export const APPROX_RADIUS_M = 150;

// No browser (só para testes) não há mapa: mostra a lista dos lugares à volta do centro.
export function SpacesMap({ results, selectedId, onSelect, onRegion, center, initial }: {
  results: SearchResult[]; selectedId: string | null; onSelect: (id: string | null) => void;
  onRegion: (b: Bbox) => void; center: LatLng | null; initial: LatLng;
}) {
  const c = center ?? initial;
  useEffect(() => {
    onRegion({ minLng: c.longitude - 0.06, maxLng: c.longitude + 0.06, minLat: c.latitude - 0.06, maxLat: c.latitude + 0.06 });
  }, [c.latitude, c.longitude]);
  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.note}>Mapa disponível na app · lista dos lugares desta zona</Text>
      {results.map((s) => (
        <Pressable key={s.id} accessibilityRole="button" onPress={() => onSelect(s.id)} style={[styles.row, s.id === selectedId && styles.sel]}>
          <View style={styles.flex}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.sub}>{s.area}</Text>
          </View>
          <Text style={styles.price}>{formatEuro(s.pricePerHour)}/h</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#E9EDEB' },
  content: { paddingTop: 190, paddingHorizontal: 16, paddingBottom: 240, gap: 8 },
  note: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.medium, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: theme.colors.white },
  sel: { borderWidth: 2, borderColor: theme.colors.accent },
  flex: { flex: 1 },
  title: { fontSize: 15, fontFamily: theme.font.semibold, color: theme.colors.text },
  sub: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  price: { fontSize: 15, fontFamily: theme.font.bold, color: theme.colors.link },
});
