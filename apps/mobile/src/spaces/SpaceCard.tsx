import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { theme } from '@/theme';
import { formatEuro, formatKw, plugLabelOf, scheduleSummary, spaceTypeLabel, type SpaceSummary } from '@/lib/spaces';

function Chip({ children }: { children: string }) {
  return <Text style={styles.chip}>{children}</Text>;
}

export function SpaceCard({ s, onManage }: { s: SpaceSummary; onManage: () => void }) {
  const visible = s.status === 'active';
  return (
    <View style={styles.card}>
      <View style={styles.cover}>
        {s.coverUrl ? <Image source={{ uri: s.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
        <Text style={[styles.status, visible ? styles.on : styles.off]}>{visible ? 'Visível' : 'Escondido'}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{s.title}</Text>
          <Text style={styles.price}>{`${formatEuro(s.pricePerHour)}/h`}</Text>
        </View>
        <View style={styles.addr}>
          <Icon name="map" size={15} color={theme.colors.textMuted} />
          <Text style={styles.muted} numberOfLines={1}>{s.address}</Text>
        </View>
        <View style={styles.chips}>
          <Chip>{formatKw(s.powerKw)}</Chip>
          <Chip>{plugLabelOf(s.plugType)}</Chip>
          <Chip>{spaceTypeLabel(s.spaceType)}</Chip>
          {s.energyPriceKwh != null ? <Chip>{`Energia ${formatEuro(s.energyPriceKwh)}/kWh`}</Chip> : null}
        </View>
        <View style={styles.addr}>
          <Icon name="clock" size={15} color={theme.colors.textMuted} />
          <Text style={styles.muted}>{scheduleSummary(s.availability)}</Text>
        </View>
        <Button title="Gerir espaço" variant="secondary" onPress={onManage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.white, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', ...theme.shadow.card },
  cover: { height: 140, backgroundColor: '#E2E7E2' },
  status: { position: 'absolute', left: 12, top: 12, fontSize: 12, fontFamily: theme.font.semibold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  on: { backgroundColor: theme.colors.greenBg, color: theme.colors.greenText },
  off: { backgroundColor: '#FDECEC', color: theme.colors.danger },
  body: { padding: 16, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 18, fontFamily: theme.font.semibold, color: theme.colors.text },
  price: { fontSize: 16, fontFamily: theme.font.bold, color: theme.colors.link },
  addr: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  muted: { flex: 1, fontSize: 14, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { fontSize: 12, fontFamily: theme.font.medium, color: theme.colors.textLabel, backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
});
