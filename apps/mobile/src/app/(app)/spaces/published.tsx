import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { formatEnergy, formatEuro, scheduleSummary, type Space } from '@/lib/spaces';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { theme } from '@/theme';

export default function Published() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useAuth();
  const [s, setS] = useState<Space | null>(null);

  useEffect(() => {
    if (id) api.get<Space>(`/me/spaces/${id}`).then(setS).catch(() => undefined);
  }, [api, id]);

  const rows: [string, string][] = s ? [
    ['Disponibilidade', scheduleSummary(s.availability)],
    ['Lugar', `${formatEuro(s.pricePerHour)}/hora`],
    ['Energia (preço de custo)', s.energyPriceKwh == null ? 'Não definida' : `${formatEnergy(s.energyPriceKwh)}/kWh`],
    ['Tomada inteligente', 'Em breve'],
  ] : [];

  return (
    <Screen background={theme.colors.screenBg}>
      <View style={styles.head}>
        <View style={styles.badge}><Icon name="check" size={36} color={theme.colors.white} strokeWidth={3} /></View>
        <Text style={styles.h1} accessibilityRole="header">Espaço publicado</Text>
        <Text style={styles.sub}>{s ? `${s.title} já está visível no mapa para os condutores.` : 'O teu espaço já está visível no mapa para os condutores.'}</Text>
      </View>
      {s ? (
        <View style={styles.card}>
          {rows.map(([k, v], i) => (
            <View key={k} style={[styles.row, i === rows.length - 1 && styles.last]}>
              <Text style={styles.k}>{k}</Text>
              <Text style={styles.v}>{v}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <Text style={styles.note}>Vais receber uma notificação sempre que alguém reservar.</Text>
      <View style={styles.flex} />
      <Button title="Ver os meus espaços" onPress={() => router.replace('/spaces')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: 10, marginTop: 24 },
  badge: { width: 76, height: 76, borderRadius: 38, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', ...theme.shadow.primary },
  h1: { fontSize: 26, fontFamily: theme.font.bold, color: theme.colors.text },
  sub: { fontSize: 15, color: theme.colors.textMuted, fontFamily: theme.font.regular, textAlign: 'center' },
  card: { borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.white, paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
  last: { borderBottomWidth: 0 },
  k: { fontSize: 14, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  v: { flex: 1, textAlign: 'right', fontSize: 14, color: theme.colors.text, fontFamily: theme.font.medium },
  note: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular, textAlign: 'center' },
  flex: { flex: 1 },
});
