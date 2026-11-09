import { Pressable, StyleSheet, View } from 'react-native';
import { theme } from '@/theme';
import { Icon } from './Icon';

export function Checkbox({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={onToggle} style={styles.row}>
      <View style={[styles.box, checked ? styles.on : styles.off]}>
        {checked && <Icon name="check" size={15} color={theme.colors.white} strokeWidth={3} />}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  box: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: theme.colors.accent },
  off: { backgroundColor: theme.colors.white, borderWidth: 1.5, borderColor: '#B7C2BE' },
});
