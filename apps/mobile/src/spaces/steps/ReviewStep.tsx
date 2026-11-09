import { StyleSheet, Text, View } from 'react-native';
import { formatEuro, formatKw, parseEuro, plugLabelOf, scheduleSummary, spaceTypeLabel } from '@/lib/spaces';
import { theme } from '@/theme';
import { powerOf, windowsOf, type SpaceDraft } from '../draft';
import { Note } from '../ui';

export function ReviewStep({ d }: { d: SpaceDraft }) {
  const energy = d.energy.trim() ? parseEuro(d.energy) : null;
  const rows: [string, string][] = [
    ['Nome', d.title.trim()],
    ['Morada', [d.address.trim(), d.spotDetails.trim()].filter(Boolean).join(' · ')],
    ['Características', `${formatKw(powerOf(d) ?? 0)} · ${d.plugType ? plugLabelOf(d.plugType) : ''} · ${spaceTypeLabel(d.spaceType)}`],
    ['Fotografias', `${d.photos.length}`],
    ['Lugar', `${formatEuro(parseEuro(d.price))}/hora`],
    ['Energia', energy == null ? 'Não definida' : `${formatEuro(energy, 3)}/kWh (preço de custo)`],
    ['Disponibilidade', scheduleSummary(windowsOf(d))],
    ['Código de acesso', d.accessCode.trim() ? 'Definido' : 'Sem código'],
  ];
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        {rows.map(([k, v], i) => (
          <View key={k} style={[styles.row, i === rows.length - 1 && styles.last]}>
            <Text style={styles.k}>{k}</Text>
            <Text style={styles.v}>{v}</Text>
          </View>
        ))}
      </View>
      <Note>Ao publicar, o espaço fica visível no mapa para os condutores nas janelas que definiste. Podes editar ou desativar a qualquer momento.</Note>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  card: { borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.white, paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.divider },
  last: { borderBottomWidth: 0 },
  k: { fontSize: 14, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  v: { flex: 1, textAlign: 'right', fontSize: 14, color: theme.colors.text, fontFamily: theme.font.medium },
});
