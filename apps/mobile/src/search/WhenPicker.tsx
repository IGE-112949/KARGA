import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TIMES } from '@/lib/spaces';
import { theme } from '@/theme';
import { dayChips, freshWhen, isPastStart, type When } from './search';

function Stepper({ label, value, onPrev, onNext }: { label: string; value: string; onPrev: () => void; onNext: () => void }) {
  return (
    <View style={styles.box}>
      <Text style={styles.boxLabel}>{label}</Text>
      <View style={styles.boxRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}: menos`} onPress={onPrev} hitSlop={6} style={styles.round}><Text style={styles.sign}>−</Text></Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label}: mais`} onPress={onNext} hitSlop={6} style={styles.round}><Text style={styles.sign}>+</Text></Pressable>
      </View>
    </View>
  );
}

// Dia (hoje + 3), hora de chegada (30 em 30 min) e duração (1–12 h), como no mockup.
export function WhenPicker({ when, onChange }: { when: When; onChange: (w: When) => void }) {
  const idx = TIMES.indexOf(when.start);
  return (
    <View style={styles.wrap}>
      <View style={styles.days}>
        {dayChips().map((d) => {
          const on = d.offset === when.dayOffset;
          return (
            <Pressable key={d.offset} accessibilityRole="button" accessibilityLabel={d.top} accessibilityState={{ selected: on }}
              onPress={() => onChange(freshWhen({ ...when, dayOffset: d.offset }))} style={[styles.day, on && styles.dayOn]}>
              <Text style={[styles.dayTop, on && styles.on]}>{d.top}</Text>
              <Text style={[styles.dayBot, on && styles.on]}>{d.bot}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.row}>
        <Stepper label="Chegada" value={when.start}
          onPrev={() => {
            // Hoje não recua para horas que já passaram.
            const prev = { ...when, start: TIMES[(idx - 1 + TIMES.length) % TIMES.length] };
            if (!isPastStart(prev) && !(when.dayOffset === 0 && prev.start > when.start)) onChange(prev);
          }}
          onNext={() => onChange({ ...when, start: TIMES[(idx + 1) % TIMES.length] })} />
        <Stepper label="Duração" value={`${when.hours} h`}
          onPrev={() => onChange({ ...when, hours: Math.max(1, when.hours - 1) })}
          onNext={() => onChange({ ...when, hours: Math.min(12, when.hours + 1) })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  days: { flexDirection: 'row', gap: 8 },
  day: { flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.fieldBorder, alignItems: 'center', backgroundColor: theme.colors.white },
  dayOn: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
  dayTop: { fontSize: 14, fontFamily: theme.font.semibold, color: theme.colors.text },
  dayBot: { fontSize: 12, fontFamily: theme.font.regular, color: theme.colors.textMuted },
  on: { color: theme.colors.white },
  row: { flexDirection: 'row', gap: 10 },
  box: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 10, gap: 6, backgroundColor: theme.colors.white },
  boxLabel: { fontSize: 12, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  boxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: theme.colors.fieldBorder, alignItems: 'center', justifyContent: 'center' },
  sign: { fontSize: 18, color: theme.colors.text, fontFamily: theme.font.medium, lineHeight: 20 },
  value: { fontSize: 17, fontFamily: theme.font.semibold, color: theme.colors.text },
});
