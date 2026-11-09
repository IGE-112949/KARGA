import { StyleSheet, View } from 'react-native';
import { theme } from '@/theme';

export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`Passo ${current} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: i < current ? theme.colors.accent : theme.colors.divider }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  dot: { width: 22, height: 6, borderRadius: 3 },
});
