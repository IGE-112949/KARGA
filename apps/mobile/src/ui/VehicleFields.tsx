import { StyleSheet, Text, View } from 'react-native';
import { TextField } from './TextField';
import { Chip } from './Chip';
import { theme } from '@/theme';
import type { PlugType } from '@/lib/types';

export type VehicleForm = { makeModel: string; plate: string; plugType: PlugType | null };

export const PLUGS: { value: PlugType; label: string }[] = [
  { value: 'type2', label: 'Tipo 2' },
  { value: 'schuko', label: 'Schuko' },
  { value: 'ccs', label: 'CCS' },
];

export const plugLabel = (p: PlugType) => PLUGS.find((x) => x.value === p)?.label ?? p;

// Campos do veículo (passo 3 do registo e formulário do Perfil).
export function VehicleFields({ value, onChange, errors }: {
  value: VehicleForm; onChange: (v: VehicleForm) => void; errors: Record<string, string>;
}) {
  return (
    <View style={styles.wrap}>
      <TextField label="Marca / Modelo" placeholder="ex.: Renault Zoe" value={value.makeModel} error={errors.makeModel}
        onChangeText={(makeModel) => onChange({ ...value, makeModel })} />
      <TextField label="Matrícula" placeholder="AA-00-AA" autoCapitalize="characters" autoCorrect={false} value={value.plate}
        error={errors.plate} onChangeText={(plate) => onChange({ ...value, plate })} />
      <View style={styles.plugs}>
        <Text style={styles.label}>Ficha do carro</Text>
        <View style={styles.row}>
          {PLUGS.map((p) => (
            <Chip key={p.value} label={p.label} selected={value.plugType === p.value} onPress={() => onChange({ ...value, plugType: p.value })} />
          ))}
        </View>
        {errors.plugType ? <Text style={styles.error}>{errors.plugType}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  plugs: { gap: 8 },
  label: { fontSize: 14, fontFamily: theme.font.medium, color: theme.colors.textLabel },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { fontSize: 13, color: theme.colors.danger, fontFamily: theme.font.regular },
});
