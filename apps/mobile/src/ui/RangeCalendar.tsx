import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { theme } from '@/theme';

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const HEAD = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const same = (a: Date | null, b: Date | null) => !!a && !!b && a.getTime() === b.getTime();
export const dayLabel = (d: Date) => `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
export const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;

// Calendário mensal para escolher um intervalo: 1.º toque = início, 2.º = fim; um 3.º recomeça.
export function RangeCalendar({ start, end, onChange, minDate = startOfDay(new Date()) }: {
  start: Date | null; end: Date | null; onChange: (start: Date | null, end: Date | null) => void; minDate?: Date;
}) {
  const [month, setMonth] = useState(() => new Date((start ?? minDate).getFullYear(), (start ?? minDate).getMonth(), 1));
  const first = (month.getDay() + 6) % 7; // segunda = 0
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  const canPrev = month > new Date(minDate.getFullYear(), minDate.getMonth(), 1);

  const pick = (d: Date) => {
    if (!start || end) onChange(d, null);
    else if (d < start) onChange(d, null);
    else onChange(start, d);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" accessibilityState={{ disabled: !canPrev }} disabled={!canPrev}
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} hitSlop={8} style={[styles.nav, !canPrev && styles.dim]}>
          <Icon name="back" size={20} />
        </Pressable>
        <Text style={styles.month}>{MONTHS[month.getMonth()]} {month.getFullYear()}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Mês seguinte"
          onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} hitSlop={8} style={styles.nav}>
          <Icon name="chevron" size={20} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {HEAD.map((h, i) => <Text key={i} style={styles.dow}>{h}</Text>)}
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.cell} />;
          const disabled = d < minDate;
          const isEdge = same(d, start) || same(d, end);
          const inRange = !!start && !!end && d > start && d < end;
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={dayLabel(d)} accessibilityState={{ disabled, selected: isEdge || inRange }}
              disabled={disabled} onPress={() => pick(d)} style={[styles.cell, inRange && styles.range]}>
              <View style={[styles.day, isEdge && styles.edge]}>
                <Text style={[styles.num, disabled && styles.past, isEdge && styles.edgeText]}>{d.getDate()}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.colors.white, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, padding: 12, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.3 },
  month: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.colors.text, textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dow: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, fontFamily: theme.font.semibold, color: theme.colors.textMuted, paddingVertical: 4 },
  cell: { width: `${100 / 7}%`, height: 42, alignItems: 'center', justifyContent: 'center' },
  range: { backgroundColor: theme.colors.greenBg },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  edge: { backgroundColor: theme.colors.accent },
  num: { fontSize: 15, fontFamily: theme.font.medium, color: theme.colors.text },
  past: { color: '#C3CBC8' },
  edgeText: { color: theme.colors.white, fontFamily: theme.font.semibold },
});
