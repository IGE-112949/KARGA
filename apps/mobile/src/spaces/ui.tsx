import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Icon, type IconName } from '@/ui/Icon';
import { theme } from '@/theme';

export function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function FieldError({ children }: { children?: string }) {
  return children ? <Text style={styles.error}>{children}</Text> : null;
}

export function Note({ icon = 'info', children }: { icon?: IconName; children: React.ReactNode }) {
  return (
    <View style={styles.note}>
      <Icon name={icon} size={18} color={theme.colors.link} />
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

// Ilustrações próprias (não são fotos): tomada Schuko e wallbox Tipo 2.
export function PlugArt({ kind }: { kind: 'schuko' | 'type2' }) {
  const c = theme.colors.text;
  return kind === 'schuko' ? (
    <Svg width={44} height={44} viewBox="0 0 44 44">
      <Rect x={4} y={4} width={36} height={36} rx={9} fill="#F4F7F6" stroke={c} strokeWidth={1.6} />
      <Circle cx={22} cy={22} r={11} fill="#FFFFFF" stroke={c} strokeWidth={1.6} />
      <Circle cx={17} cy={22} r={2} fill={c} />
      <Circle cx={27} cy={22} r={2} fill={c} />
      <Rect x={20.5} y={10.5} width={3} height={3} rx={0.8} fill={theme.colors.accent} />
      <Rect x={20.5} y={30.5} width={3} height={3} rx={0.8} fill={theme.colors.accent} />
    </Svg>
  ) : (
    <Svg width={44} height={44} viewBox="0 0 44 44">
      <Rect x={9} y={3} width={22} height={30} rx={6} fill="#F4F7F6" stroke={c} strokeWidth={1.6} />
      <Circle cx={20} cy={13} r={4.5} fill="none" stroke={theme.colors.accent} strokeWidth={1.8} />
      <Path d="M17 25h6" stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M31 22c6 0 7 4 7 9v6" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={34} y={36} width={8} height={6} rx={2} fill={c} />
    </Svg>
  );
}

export function OptionCard({ title, subtitle, selected, onPress, art }: {
  title: string; subtitle: string; selected: boolean; onPress: () => void; art?: React.ReactNode;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}, ${subtitle}`} accessibilityState={{ selected }}
      onPress={onPress} style={[styles.option, selected ? styles.optionOn : styles.optionOff]}>
      {art}
      <View style={styles.flex}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSub}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioOn]} />
    </Pressable>
  );
}

export const shared = StyleSheet.create({
  section: { gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { fontSize: 14, fontFamily: theme.font.medium, color: theme.colors.textLabel },
  error: { fontSize: 13, color: theme.colors.danger, fontFamily: theme.font.medium },
  note: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: theme.colors.greenBg, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18, color: theme.colors.greenText, fontFamily: theme.font.regular },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: theme.colors.white },
  optionOn: { borderWidth: 2, borderColor: theme.colors.accent },
  optionOff: { borderWidth: 1.5, borderColor: theme.colors.fieldBorder },
  optionTitle: { fontSize: 16, fontFamily: theme.font.semibold, color: theme.colors.text },
  optionSub: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.colors.fieldBorder },
  radioOn: { borderWidth: 7, borderColor: theme.colors.accent },
  day: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.divider, gap: 8 },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { fontSize: 15, fontFamily: theme.font.semibold, color: theme.colors.text },
  dayOff: { color: theme.colors.textMuted, fontFamily: theme.font.regular },
  dayBody: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  small: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  allDay: { fontSize: 14, color: theme.colors.greenText, fontFamily: theme.font.medium, flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.fieldBorder, borderRadius: 12, height: 38 },
  stepBtn: { width: 30, alignItems: 'center', justifyContent: 'center', height: '100%' },
  stepSign: { fontSize: 18, color: theme.colors.text, fontFamily: theme.font.medium },
  stepValue: { minWidth: 48, textAlign: 'center', fontSize: 15, fontFamily: theme.font.semibold, color: theme.colors.text },
  allDayChip: { marginLeft: 'auto', paddingHorizontal: 12, height: 34, borderRadius: 17, borderWidth: 1, borderColor: theme.colors.fieldBorder, justifyContent: 'center' },
  allDayChipOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  allDayChipText: { fontSize: 13, fontFamily: theme.font.medium, color: theme.colors.text },
});
