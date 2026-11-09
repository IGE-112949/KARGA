import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/theme';
import { Icon, type IconName } from './Icon';

const ICON_STYLE: Record<string, { bg: string; fg: string }> = {
  car: { bg: '#ECF8F2', fg: '#047857' },
  home: { bg: '#E8EEF5', fg: '#13263A' },
  swap: { bg: '#F2F5F4', fg: '#3E4B57' },
};

export function RoleCard({ title, description, icon, selected, onPress }: {
  title: string; description: string; icon: IconName; selected: boolean; onPress: () => void;
}) {
  const c = ICON_STYLE[icon] ?? ICON_STYLE.swap;
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={title} onPress={onPress}
      style={[styles.card, selected ? styles.selected : styles.idle]}>
      <View style={[styles.icon, { backgroundColor: c.bg }]}><Icon name={icon} size={24} color={c.fg} /></View>
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
      <View style={[styles.radio, selected ? styles.radioOn : styles.radioOff]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, backgroundColor: theme.colors.white },
  selected: { borderWidth: 2, borderColor: theme.colors.accent, shadowColor: '#10B981', shadowOpacity: 0.15, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  idle: { borderWidth: 1.5, borderColor: theme.colors.divider },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontFamily: theme.font.semibold, color: theme.colors.text },
  desc: { fontSize: 13, lineHeight: 18, fontFamily: theme.font.regular, color: theme.colors.textMuted },
  radio: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.white },
  radioOn: { borderWidth: 7, borderColor: theme.colors.accent },
  radioOff: { borderWidth: 2, borderColor: '#C3CCC8' },
});
