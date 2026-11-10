import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { theme } from '@/theme';

// Linha de menu como no mockup do perfil: ícone, título, subtítulo e seta.
export function MenuRow({ icon, title, sub, onPress, last, iconBg = theme.colors.greenBg, iconColor = theme.colors.link, badge, label, children, danger }: {
  icon: IconName; title: string; sub?: string; onPress?: () => void; last?: boolean;
  iconBg?: string; iconColor?: string; badge?: string; label?: string; children?: ReactNode; danger?: boolean;
}) {
  const body = (
    <>
      <View style={[styles.icon, { backgroundColor: iconBg }]}><Icon name={icon} size={20} color={iconColor} /></View>
      <View style={styles.text}>
        <View style={styles.titleLine}>
          <Text style={[styles.title, danger && styles.danger]}>{title}</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
        {children}
      </View>
      {onPress ? <Icon name="chevron" size={20} color={theme.colors.textMuted} /> : null}
    </>
  );
  if (!onPress) return <View style={[styles.row, last && styles.last, styles.disabled]}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label ?? title} onPress={onPress}
      style={({ pressed }) => [styles.row, last && styles.last, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

export const menuCard = {
  backgroundColor: theme.colors.white, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' as const,
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 16, minHeight: 68, borderBottomWidth: 1, borderBottomColor: '#EEF2F0' },
  last: { borderBottomWidth: 0 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 17, fontFamily: theme.font.semibold, color: theme.colors.text },
  danger: { color: theme.colors.danger },
  sub: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  badge: { fontSize: 11, fontFamily: theme.font.semibold, color: theme.colors.greenText, backgroundColor: theme.colors.greenBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.7 },
});
