import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import type { SpaceSummary } from '@/lib/spaces';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { theme } from '@/theme';
import { SpaceCard } from '@/spaces/SpaceCard';

export default function SpacesList() {
  const router = useRouter();
  const { api } = useAuth();
  const [spaces, setSpaces] = useState<SpaceSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    api.get<SpaceSummary[]>('/me/spaces').then(setSpaces).catch((e) => setError(e instanceof ApiError ? e.message : 'Ocorreu um erro.'));
  }, [api]);

  useFocusEffect(load);

  const add = () => router.push('/spaces/new');
  return (
    <Screen background={theme.colors.screenBg} contentStyle={styles.content}>
      <Text style={styles.h1} accessibilityRole="header">Os meus espaços</Text>
      {error ? (
        <View style={styles.center}>
          <Text style={styles.muted}>{error}</Text>
          <Button title="Tentar novamente" variant="secondary" onPress={load} />
        </View>
      ) : spaces === null ? (
        <ActivityIndicator color={theme.colors.accent} style={styles.loader} />
      ) : spaces.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.badge}><Icon name="home" size={30} color={theme.colors.link} /></View>
          <Text style={styles.emptyTitle}>Ainda não tens espaços</Text>
          <Text style={styles.muted}>Publica o teu lugar com tomada e começa a ganhar com as horas em que não o usas.</Text>
          <Button title="Adicionar o primeiro espaço" onPress={add} />
        </View>
      ) : (
        <>
          {spaces.map((s) => (
            <SpaceCard key={s.id} s={s} onManage={() => router.push({ pathname: '/spaces/[id]', params: { id: s.id } })} />
          ))}
          <Button title="Adicionar espaço" variant="secondary" onPress={add} icon={<Icon name="plus" size={18} color={theme.colors.text} />} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, gap: 16 },
  h1: { fontSize: 26, fontFamily: theme.font.bold, color: theme.colors.text },
  loader: { marginTop: 40 },
  center: { gap: 12, alignItems: 'stretch', marginTop: 24 },
  empty: { alignItems: 'center', gap: 12, marginTop: 40, paddingHorizontal: 8 },
  badge: { width: 64, height: 64, borderRadius: 20, backgroundColor: theme.colors.greenBg, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontFamily: theme.font.semibold, color: theme.colors.text },
  muted: { fontSize: 15, lineHeight: 21, color: theme.colors.textMuted, fontFamily: theme.font.regular, textAlign: 'center' },
});
