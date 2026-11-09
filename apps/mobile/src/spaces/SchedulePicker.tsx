import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/ui/Button';
import { END_TIMES, TIMES, WEEKDAYS, WEEKDAY_NAMES, isAllDay, scheduleSummary } from '@/lib/spaces';
import { theme } from '@/theme';
import { DEFAULT_DAY, windowsOf, type DayDraft, type SpaceDraft } from './draft';

const cycle = (list: string[], v: string, d: number) => list[(list.indexOf(v) + d + list.length) % list.length];

function TimeBox({ label, value, onPrev, onNext, a11y }: { label: string; value: string; onPrev: () => void; onNext: () => void; a11y: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.boxLabel}>{label}</Text>
      <View style={styles.boxRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${a11y}: mais cedo`} onPress={onPrev} hitSlop={6} style={styles.round}>
          <Text style={styles.sign}>−</Text>
        </Pressable>
        <Text style={styles.time}>{value}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${a11y}: mais tarde`} onPress={onNext} hitSlop={6} style={styles.round}>
          <Text style={styles.sign}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Dias como no mockup: os ativos ficam verdes; tocar num dia mostra (e ativa) o horário desse dia.
export function SchedulePicker({ d, set }: { d: SpaceDraft; set: (p: Partial<SpaceDraft>) => void }) {
  const [focus, setFocus] = useState(() => Math.max(0, d.days.findIndex((x) => x.on)));
  const day = d.days[focus];
  const name = WEEKDAY_NAMES[focus];

  const update = (i: number, nd: DayDraft) => set({ days: d.days.map((x, j) => (j === i ? nd : x)) });

  const tap = (i: number) => {
    if (!d.days[i].on) {
      // Novo dia começa com o horário do dia que estava aberto (ou 19:00–08:00).
      const base = d.days[focus].on ? d.days[focus] : DEFAULT_DAY;
      update(i, { on: true, startTime: base.startTime, endTime: base.endTime });
    }
    setFocus(i);
  };

  const allDay = isAllDay(day);
  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {WEEKDAYS.map((w, i) => {
          const on = d.days[i].on;
          const focused = i === focus && on;
          return (
            <Pressable key={w} accessibilityRole="button" accessibilityLabel={WEEKDAY_NAMES[i]} accessibilityState={{ selected: on }}
              onPress={() => tap(i)} style={[styles.chip, on ? styles.chipOn : styles.chipOff, focused && styles.chipFocus]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{w}</Text>
            </Pressable>
          );
        })}
      </View>

      {day.on ? (
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.dayName}>{name}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`${name}: dia todo`} accessibilityState={{ selected: allDay }}
              onPress={() => update(focus, allDay ? { ...DEFAULT_DAY, on: true } : { on: true, startTime: '00:00', endTime: '24:00' })}
              style={[styles.pill, allDay && styles.pillOn]}>
              <Text style={[styles.pillText, allDay && styles.chipTextOn]}>Dia todo</Text>
            </Pressable>
          </View>
          {allDay ? <Text style={styles.allDay}>Disponível as 24 horas</Text> : (
            <View style={styles.times}>
              <TimeBox label="Disponível das" a11y={`${name} início`} value={day.startTime}
                onPrev={() => update(focus, { ...day, startTime: cycle(TIMES, day.startTime, -1) })}
                onNext={() => update(focus, { ...day, startTime: cycle(TIMES, day.startTime, 1) })} />
              <TimeBox label="Até às" a11y={`${name} fim`} value={day.endTime}
                onPrev={() => update(focus, { ...day, endTime: cycle(END_TIMES, day.endTime, -1) })}
                onNext={() => update(focus, { ...day, endTime: cycle(END_TIMES, day.endTime, 1) })} />
            </View>
          )}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${name}`} hitSlop={8}
              onPress={() => {
                update(focus, { ...day, on: false });
                const next = d.days.findIndex((x, j) => x.on && j !== focus);
                if (next >= 0) setFocus(next);
              }}>
              <Text style={styles.remove}>Remover {name.toLowerCase()}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Text style={styles.hint}>Toca nos dias em que o lugar está livre. Cada dia pode ter o seu horário.</Text>
      )}

      <Text style={styles.summary}>{scheduleSummary(windowsOf(d))}</Text>
      <Button title="Aplicar a todos os dias" variant="secondary" disabled={!day.on}
        onPress={() => set({ days: d.days.map(() => ({ ...day, on: true })) })} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  chips: { flexDirection: 'row', justifyContent: 'space-between' },
  chip: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: theme.colors.accent },
  chipOff: { backgroundColor: theme.colors.white, borderWidth: 1.5, borderColor: theme.colors.fieldBorder },
  chipFocus: { borderWidth: 3, borderColor: theme.colors.navy },
  chipText: { fontSize: 13, fontFamily: theme.font.semibold, color: theme.colors.textLabel },
  chipTextOn: { color: theme.colors.white },
  card: { backgroundColor: theme.colors.white, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, padding: 14, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.colors.text },
  pill: { paddingHorizontal: 12, height: 32, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.fieldBorder, justifyContent: 'center' },
  pillOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  pillText: { fontSize: 13, fontFamily: theme.font.medium, color: theme.colors.text },
  allDay: { fontSize: 15, fontFamily: theme.font.medium, color: theme.colors.greenText },
  times: { flexDirection: 'row', gap: 10 },
  box: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 10, gap: 6 },
  boxLabel: { fontSize: 12, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  boxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: theme.colors.fieldBorder, alignItems: 'center', justifyContent: 'center' },
  sign: { fontSize: 18, color: theme.colors.text, fontFamily: theme.font.medium, lineHeight: 20 },
  time: { fontSize: 18, fontFamily: theme.font.semibold, color: theme.colors.text },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
  remove: { fontSize: 14, fontFamily: theme.font.medium, color: theme.colors.danger },
  hint: { fontSize: 14, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  summary: { fontSize: 13, color: theme.colors.textLabel, fontFamily: theme.font.medium },
});
