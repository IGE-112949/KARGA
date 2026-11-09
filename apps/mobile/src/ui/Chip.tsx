import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '@/theme';

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={[styles.chip, selected ? styles.on : styles.off]}>
      <Text style={[styles.label, { color: selected ? theme.colors.white : theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { height: 40, paddingHorizontal: 16, borderRadius: theme.radius.chip, borderWidth: 1, justifyContent: 'center' },
  on: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  off: { backgroundColor: theme.colors.white, borderColor: theme.colors.fieldBorder },
  label: { fontSize: 14, fontFamily: theme.font.medium },
});
