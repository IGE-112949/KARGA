import { StyleSheet, Text, View } from 'react-native';
import { TextField } from '@/ui/TextField';
import { formatEuro, monthlyEstimate, parseEuro, weeklyHours } from '@/lib/spaces';
import type { Errors } from '@/lib/validation';
import { theme } from '@/theme';
import { windowsOf, type SpaceDraft } from '../draft';
import { FieldError, Label, Note } from '../ui';
import { SchedulePicker } from '../SchedulePicker';

export function PricePart({ d, set, errors }: { d: SpaceDraft; set: (p: Partial<SpaceDraft>) => void; errors: Errors }) {
  return (
    <View style={styles.section}>
      <View style={styles.prices}>
        <View style={styles.flex}>
          <TextField label="Lugar (€/hora)" placeholder="0,30" keyboardType="decimal-pad" value={d.price} error={errors.price}
            onChangeText={(price) => set({ price })} />
        </View>
        <View style={styles.flex}>
          <TextField label="Energia (€/kWh)" placeholder="0,15" keyboardType="decimal-pad" value={d.energy} error={errors.energy}
            onChangeText={(energy) => set({ energy })} hint="Opcional" />
        </View>
      </View>
      <Note>Na energia indica o preço da tua tarifa. É cobrada a preço de custo, sem margem.</Note>
    </View>
  );
}

export function SchedulePart({ d, set, errors }: { d: SpaceDraft; set: (p: Partial<SpaceDraft>) => void; errors: Errors }) {
  return (
    <View style={styles.section}>
      <Label>Dias disponíveis</Label>
      <SchedulePicker d={d} set={set} />
      <FieldError>{errors.days}</FieldError>
    </View>
  );
}

export function Estimate({ d }: { d: SpaceDraft }) {
  const ws = windowsOf(d);
  const price = parseEuro(d.price);
  const value = Number.isNaN(price) ? 0 : monthlyEstimate(ws, price);
  const hours = weeklyHours(ws);
  return (
    <View style={styles.estimate}>
      <Text style={styles.estimateLabel}>Estimativa de ganhos com o aluguer</Text>
      <Text style={styles.estimateValue}>≈ {formatEuro(value, 0).replace(' €', '')} €/mês</Text>
      <Text style={styles.estimateSub}>
        Com 50% de ocupação nas janelas definidas ({String(Number(hours.toFixed(1))).replace('.', ',')} h por semana). Antes da taxa de serviço; a energia não está incluída.
      </Text>
    </View>
  );
}

export function PriceScheduleStep(props: { d: SpaceDraft; set: (p: Partial<SpaceDraft>) => void; errors: Errors }) {
  return (
    <View style={styles.wrap}>
      <PricePart {...props} />
      <SchedulePart {...props} />
      <Estimate d={props.d} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 22 },
  section: { gap: 10 },
  prices: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  estimate: { padding: 16, borderRadius: 18, backgroundColor: theme.colors.navy, gap: 4 },
  estimateLabel: { fontSize: 13, color: '#B9C6D1', fontFamily: theme.font.medium },
  estimateValue: { fontSize: 26, color: theme.colors.white, fontFamily: theme.font.bold },
  estimateSub: { fontSize: 12, lineHeight: 17, color: '#B9C6D1', fontFamily: theme.font.regular },
});
