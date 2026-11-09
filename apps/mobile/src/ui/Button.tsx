import { useMemo, useRef, useState } from 'react';
import { singleFlight } from '@/lib/singleFlight';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { theme } from '@/theme';

type Variant = 'primary' | 'secondary' | 'text' | 'danger';

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, icon, style }: {
  title: string;
  onPress?: () => void | Promise<unknown>;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}) {
  const [busy, setBusy] = useState(false);
  const isLoading = loading || busy;
  const inactive = disabled || isLoading;
  const latest = useRef(onPress);
  latest.current = onPress;
  // Ignora toques enquanto o pedido anterior não termina.
  const guarded = useMemo(() => singleFlight(() => latest.current?.(), setBusy), []);
  const handlePress = () => {
    if (!inactive) void guarded();
  };

  const v = variants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: isLoading }}
      onPress={handlePress}
      style={({ pressed }) => [styles.base, v.container, disabled && styles.disabled, pressed && !inactive && styles.pressed, style]}
    >
      {isLoading ? (
        <ActivityIndicator testID="button-loading" color={v.spinner} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.label, v.label]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 56, borderRadius: theme.radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 17, fontFamily: theme.font.semibold },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
});

const variants: Record<Variant, { container: ViewStyle; label: { color: string; fontSize?: number; fontFamily?: string }; spinner: string }> = {
  primary: { container: { backgroundColor: theme.colors.accent, ...theme.shadow.primary }, label: { color: theme.colors.white }, spinner: theme.colors.white },
  secondary: { container: { backgroundColor: theme.colors.white, borderWidth: 1.5, borderColor: theme.colors.fieldBorder }, label: { color: theme.colors.text }, spinner: theme.colors.text },
  text: { container: { backgroundColor: 'transparent', height: 44 }, label: { color: theme.colors.textLabel, fontSize: 15, fontFamily: theme.font.medium }, spinner: theme.colors.textLabel },
  danger: { container: { backgroundColor: theme.colors.white, borderWidth: 1.5, borderColor: theme.colors.dangerBorder, height: 48, borderRadius: 14 }, label: { color: theme.colors.danger, fontSize: 15 }, spinner: theme.colors.danger },
};
