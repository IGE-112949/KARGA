import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/ui/Icon';
import { theme } from '@/theme';

export function WizardHeader({ label, title, sub, onBack, onClose, progress }: {
  label: string; title: string; sub?: string; onBack: () => void; onClose?: () => void; progress?: number;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} hitSlop={8} style={styles.btn}>
          <Icon name="back" size={22} />
        </Pressable>
        <Text style={styles.label}>{label}</Text>
        {onClose ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} hitSlop={8} style={styles.btn}>
            <Icon name="close" size={22} />
          </Pressable>
        ) : <View style={styles.btn} />}
      </View>
      {progress !== undefined ? (
        <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel={label}>
          <View style={[styles.bar, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      ) : null}
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, marginBottom: 6 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  track: { height: 5, borderRadius: 3, backgroundColor: theme.colors.divider, overflow: 'hidden', marginBottom: 12 },
  bar: { height: 5, borderRadius: 3, backgroundColor: theme.colors.accent },
  label: { fontSize: 13, fontFamily: theme.font.semibold, color: theme.colors.textMuted },
  title: { fontSize: 26, fontFamily: theme.font.bold, color: theme.colors.text },
  sub: { fontSize: 15, color: theme.colors.textMuted, fontFamily: theme.font.regular },
});
