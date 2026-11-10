import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '@/ui/Icon';
import { formatEuro, formatKw, plugLabelOf } from '@/lib/spaces';
import { theme } from '@/theme';
import type { SearchResult } from './types';

export function Heart({ on, onPress, size = 22 }: { on: boolean; onPress: () => void; size?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={on ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} accessibilityState={{ selected: on }}
      onPress={onPress} hitSlop={8} style={styles.heart}>
      <Icon name="heart" size={size} color={on ? '#E11D48' : theme.colors.text} filled={on} />
    </Pressable>
  );
}

// Cartão do lugar selecionado (mapa) e das listas (favoritos).
export function ResultCard({ s, onOpen, onToggleFavorite, footer }: {
  s: SearchResult; onOpen: () => void; onToggleFavorite: () => void; footer?: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalhes de ${s.title}`} onPress={onOpen} style={styles.row}>
        <View style={styles.cover}>{s.coverUrl ? <Image source={{ uri: s.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}</View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>{s.title}</Text>
          <View style={styles.line}>
            <Icon name="map" size={14} color={theme.colors.textMuted} />
            <Text style={styles.muted} numberOfLines={1}>{s.area ?? 'Zona não indicada'}</Text>
          </View>
          <View style={styles.line}>
            <Icon name="bolt" size={14} color={theme.colors.link} />
            <Text style={styles.muted}>{formatKw(s.powerKw)} · {plugLabelOf(s.plugType)}</Text>
          </View>
          <Text style={styles.price}>{formatEuro(s.pricePerHour)}<Text style={styles.per}>/hora</Text></Text>
        </View>
      </Pressable>
      <View style={styles.heartPos}><Heart on={s.isFavorite} onPress={onToggleFavorite} /></View>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.white, borderRadius: 22, padding: 12, ...theme.shadow.card, gap: 10 },
  row: { flexDirection: 'row', gap: 12 },
  cover: { width: 96, height: 96, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E2E7E2' },
  body: { flex: 1, gap: 4, paddingRight: 30 },
  title: { fontSize: 17, fontFamily: theme.font.semibold, color: theme.colors.text },
  line: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  muted: { flex: 1, fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  price: { fontSize: 18, fontFamily: theme.font.bold, color: theme.colors.text, marginTop: 2 },
  per: { fontSize: 13, fontFamily: theme.font.regular, color: theme.colors.textMuted },
  heartPos: { position: 'absolute', right: 12, top: 12 },
  heart: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
});
