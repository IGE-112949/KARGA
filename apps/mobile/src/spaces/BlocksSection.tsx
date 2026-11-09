import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TextField } from '@/ui/TextField';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import type { SpaceBlock } from '@/lib/spaces';
import { theme } from '@/theme';
import { blockLabel, blockRange, parseDate } from './blocks';

export function BlocksSection({ blocks, onAdd, onRemove }: {
  blocks: SpaceBlock[];
  onAdd: (b: { startsAt: string; endsAt: string; reason: string | null }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ start?: string; end?: string }>({});

  const save = async () => {
    const s = parseDate(start);
    const e = parseDate(end);
    const errs: typeof errors = {};
    if (!s) errs.start = 'Data inválida (DD/MM/AAAA)';
    if (!e) errs.end = 'Data inválida (DD/MM/AAAA)';
    else if (s && e < s) errs.end = 'O fim tem de ser depois do início';
    setErrors(errs);
    if (errs.start || errs.end) return;
    await onAdd({ ...blockRange(s!, e!), reason: reason.trim() || null });
    setOpen(false);
    setStart(''); setEnd(''); setReason('');
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
          <View style={styles.dates}>
            <View style={styles.flex}><TextField label="Início" placeholder="DD/MM/AAAA" value={start} onChangeText={setStart} error={errors.start} keyboardType="numbers-and-punctuation" /></View>
            <View style={styles.flex}><TextField label="Fim" placeholder="DD/MM/AAAA" value={end} onChangeText={setEnd} error={errors.end} keyboardType="numbers-and-punctuation" /></View>
          </View>
          <TextField label="Motivo (opcional)" placeholder="ex.: Férias" value={reason} onChangeText={setReason} />
          <Button title="Guardar bloqueio" onPress={save} />
          <Button title="Cancelar" variant="text" onPress={() => setOpen(false)} />
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
  dates: { flexDirection: 'row', gap: 12 },
});
