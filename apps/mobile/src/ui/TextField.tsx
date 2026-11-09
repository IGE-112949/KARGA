import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { theme } from '@/theme';
import { Icon } from './Icon';

export function TextField({ label, error, hint, secureTextEntry, style, ...input }: TextInputProps & {
  label: string; error?: string; hint?: string;
}) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor="#9AA5AE"
          secureTextEntry={secureTextEntry && hidden}
          onFocus={(e) => { setFocused(true); input.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); input.onBlur?.(e); }}
          style={[styles.input, secureTextEntry && { paddingRight: 52 }, focused && styles.focused, !!error && styles.invalid, style]}
          {...input}
        />
        {secureTextEntry && (
          <Pressable accessibilityRole="button" accessibilityLabel={hidden ? 'Mostrar password' : 'Esconder password'}
            onPress={() => setHidden((h) => !h)} style={styles.eye}>
            <Icon name="eye" size={20} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontFamily: theme.font.medium, color: theme.colors.textLabel },
  input: {
    height: 50, paddingHorizontal: 16, borderWidth: 1.5, borderColor: theme.colors.fieldBorder, borderRadius: theme.radius.field,
    fontSize: 16, fontFamily: theme.font.regular, color: theme.colors.text, backgroundColor: theme.colors.white,
  },
  focused: { borderColor: theme.colors.accent },
  invalid: { borderColor: theme.colors.dangerBorder },
  eye: { position: 'absolute', right: 3, top: 3, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 13, color: theme.colors.danger, fontFamily: theme.font.regular },
  hint: { fontSize: 12, color: theme.colors.textMuted, fontFamily: theme.font.regular },
});
