import { Pressable, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { Icon } from './Icon';

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onPress} style={styles.btn}>
      <Icon name="back" size={22} color={theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 44, height: 44, marginLeft: -10, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
