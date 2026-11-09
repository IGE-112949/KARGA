import { StyleSheet, Text, View } from 'react-native';
import { BackButton } from './BackButton';
import { StepDots } from './StepDots';
import { theme } from '@/theme';

export function StepHeader({ step, onBack }: { step: number; onBack?: () => void }) {
  return (
    <View style={styles.row}>
      {onBack ? <BackButton onPress={onBack} /> : <View style={styles.spacer} />}
      <StepDots total={3} current={step} />
    </View>
  );
}

export function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={styles.head}>
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spacer: { height: 44 },
  head: { gap: 6 },
  title: { fontSize: 28, fontFamily: theme.font.bold, color: theme.colors.text },
  sub: { fontSize: 15, color: theme.colors.textMuted, fontFamily: theme.font.regular },
});
