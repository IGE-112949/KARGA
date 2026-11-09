import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/ui/Icon';
import { theme } from '@/theme';

export function WizardHeader({ label, title, sub, onBack, onClose }: {
  label: string; title: string; sub?: string; onBack: () => void; onClose?: () => void;
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
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, marginBottom: 6 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  btn: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontFamily: theme.font.semibold, color: theme.colors.textMuted },
  title: { fontSize: 26, fontFamily: theme.font.bold, color: theme.colors.text },
  sub: { fontSize: 15, color: theme.colors.textMuted, fontFamily: theme.font.regular },
});
