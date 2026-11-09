import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@/theme';
import { Icon } from './Icon';

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Avatar({ uri, name, size = 64, onPress, editable = false }: {
  uri?: string | null; name: string; size?: number; onPress?: () => void; editable?: boolean;
}) {
  const body = (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image testID="avatar-image" source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
      ) : (
        <View style={[styles.initials, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initialsText, { fontSize: size * 0.34 }]}>{initialsOf(name)}</Text>
        </View>
      )}
      {editable && (
        <View style={styles.badge}><Icon name="camera" size={14} color={theme.colors.white} /></View>
      )}
    </View>
  );
  if (!onPress) return body;
  return <Pressable accessibilityRole="button" accessibilityLabel="Alterar foto de perfil" onPress={onPress}>{body}</Pressable>;
}

const styles = StyleSheet.create({
  initials: { backgroundColor: theme.colors.navy, alignItems: 'center', justifyContent: 'center' },
  initialsText: { color: theme.colors.white, fontFamily: theme.font.semibold },
  badge: {
    position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.accent,
    borderWidth: 2, borderColor: theme.colors.white, alignItems: 'center', justifyContent: 'center',
  },
});
