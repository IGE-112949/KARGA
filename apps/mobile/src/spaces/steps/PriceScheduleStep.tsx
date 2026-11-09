import { StyleSheet, Text, View } from 'react-native';
import { TextField } from '@/ui/TextField';
import { Button } from '@/ui/Button';
import { formatEuro, monthlyEstimate, parseEuro, weeklyHours } from '@/lib/spaces';
import type { Errors } from '@/lib/validation';
import { theme } from '@/theme';
import { windowsOf, type SpaceDraft } from '../draft';
import { DayRow, FieldError, Label, Note } from '../ui';

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
  const applyToAll = () => {
    const first = d.days.find((x) => x.on);
    if (!first) return;
    set({ days: d.days.map(() => ({ ...first, on: true })) });
  };
  return (
    <View style={styles.section}>
      <Label>Dias e horas disponíveis</Label>
      <View>
        {d.days.map((day, i) => (
          <DayRow key={i} weekday={i} day={day} onChange={(nd) => set({ days: d.days.map((x, j) => (j === i ? nd : x)) })} />
        ))}
      </View>
      <FieldError>{errors.days}</FieldError>
      <Button title="Aplicar a todos os dias" variant="secondary" onPress={applyToAll} disabled={!d.days.some((x) => x.on)} />
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
