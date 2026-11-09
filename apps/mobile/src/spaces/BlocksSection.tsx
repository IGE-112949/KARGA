import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TextField } from '@/ui/TextField';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import type { SpaceBlock } from '@/lib/spaces';
import { theme } from '@/theme';
import { RangeCalendar, shortDate } from '@/ui/RangeCalendar';
import { blockLabel, blockRange } from './blocks';

export function BlocksSection({ blocks, onAdd, onRemove }: {
  blocks: SpaceBlock[];
  onAdd: (b: { startsAt: string; endsAt: string; reason: string | null }) => Promise<boolean>;
  onRemove: (id: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setOpen(false); setStart(null); setEnd(null); setReason(''); setError(null); };

  const save = async () => {
    if (!start) return setError('Escolhe o primeiro e o último dia no calendário');
    setError(null);
    // Só um dia escolhido = bloqueia esse dia.
    const ok = await onAdd({ ...blockRange(start, end ?? start), reason: reason.trim() || null });
    if (ok) reset();
  };

  return (
    <View style={styles.wrap}>
      {blocks.length === 0 ? <Text style={styles.muted}>Sem datas bloqueadas.</Text> : null}
      {blocks.map((b) => (
        <View key={b.id} style={styles.item}>
          <Icon name="lock" size={18} color={theme.colors.textMuted} />
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>{blockLabel(b)}</Text>
            {b.reason ? <Text style={styles.muted}>{b.reason}</Text> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remover bloqueio ${blockLabel(b)}`} hitSlop={8} onPress={() => onRemove(b.id)}>
            <Icon name="trash" size={18} color={theme.colors.danger} />
          </Pressable>
        </View>
      ))}
      {open ? (
        <View style={styles.form}>
          <RangeCalendar start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); setError(null); }} />
          <Text style={styles.range}>
            {start ? (end && end.getTime() !== start.getTime() ? `${shortDate(start)} – ${shortDate(end)}` : `${shortDate(start)} (toca no último dia)`) : 'Toca no primeiro dia'}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextField label="Motivo (opcional)" placeholder="ex.: Férias" value={reason} onChangeText={setReason} />
          <Button title="Guardar bloqueio" onPress={save} />
          <Button title="Cancelar" variant="text" onPress={reset} />
        </View>
      ) : (
        <Button title="Bloquear datas" variant="secondary" onPress={() => setOpen(true)} icon={<Icon name="plus" size={18} color={theme.colors.text} />} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  flex: { flex: 1 },
  muted: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  itemTitle: { fontSize: 15, fontFamily: theme.font.medium, color: theme.colors.text },
  form: { gap: 12 },
  range: { fontSize: 15, fontFamily: theme.font.semibold, color: theme.colors.text, textAlign: 'center' },
  error: { fontSize: 13, color: theme.colors.danger, fontFamily: theme.font.medium, textAlign: 'center' },
});
