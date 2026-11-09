import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/ui/Icon';
import { theme } from '@/theme';

const POINTS = [
  'Liga e desliga a carga no início e no fim de cada reserva.',
  'Mede os kWh de cada sessão para a energia ser cobrada a preço de custo.',
  'Permite-te bloquear a tomada à distância.',
];

// Passo 4: tomada inteligente (Shelly) — ainda não disponível.
export function PlugStep() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.soon}>Em breve</Text>
      {POINTS.map((p) => (
        <View key={p} style={styles.point}>
          <Icon name="check" size={18} color={theme.colors.accent} />
          <Text style={styles.text}>{p}</Text>
        </View>
      ))}
      <View style={styles.card}>
        <View style={styles.badge}><Icon name="bolt" size={22} color={theme.colors.white} filled strokeWidth={0} /></View>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Shelly Plus Plug S</Text>
          <Text style={styles.text}>Vais poder ligá-la mais tarde em Gerir espaço. Por agora o espaço funciona só com o preço por hora.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  flex: { flex: 1 },
  soon: { alignSelf: 'flex-start', fontSize: 12, fontFamily: theme.font.semibold, color: theme.colors.greenText, backgroundColor: theme.colors.greenBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  point: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  text: { flex: 1, fontSize: 14, lineHeight: 20, color: theme.colors.textLabel, fontFamily: theme.font.regular },
  card: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.white, opacity: 0.7 },
  badge: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.colors.text },
});
