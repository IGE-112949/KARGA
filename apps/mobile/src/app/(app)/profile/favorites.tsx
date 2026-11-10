import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import { Screen } from '@/ui/Screen';
import { BackButton } from '@/ui/BackButton';
import { Icon } from '@/ui/Icon';
import { theme } from '@/theme';
import { ResultCard } from '@/search/ResultCard';
import { setFavorite } from '@/search/favorites';
import { useSearch } from '@/search/SearchContext';
import type { SearchResult } from '@/search/types';

export default function Favorites() {
  const router = useRouter();
  const { api } = useAuth();
  const { markFavorite } = useSearch();
  const [items, setItems] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<SearchResult[]>('/me/favorites')
      .then((r) => { setItems(r); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Ocorreu um erro.'));
  }, [api]);
  useFocusEffect(load);

  const remove = async (s: SearchResult) => {
    setItems((xs) => xs?.filter((x) => x.id !== s.id) ?? xs);
    markFavorite(s.id, false);
    try {
      await setFavorite(api, s.id, false);
    } catch {
      markFavorite(s.id, true);
      load();
    }
  };

  return (
    <Screen background={theme.colors.screenBg} contentStyle={styles.content}>
      <BackButton onPress={() => (router.canGoBack() ? router.back() : router.push('/profile'))} />
      <Text style={styles.h1} accessibilityRole="header">Os meus favoritos</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {items === null ? <ActivityIndicator color={theme.colors.accent} /> : items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.badge}><Icon name="heart" size={28} color="#E11D48" /></View>
          <Text style={styles.emptyTitle}>Ainda não tens favoritos</Text>
          <Text style={styles.muted}>Toca no coração de um lugar no mapa para o guardares aqui.</Text>
        </View>
      ) : items.map((s) => (
        <ResultCard key={s.id} s={s}
          onOpen={() => router.push({ pathname: '/home/space/[id]', params: { id: s.id } })}
          onToggleFavorite={() => remove(s)}
          footer={s.status === 'inactive' ? <Text style={styles.inactive}>Indisponível de momento</Text> : undefined} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 14 },
  h1: { fontSize: 26, fontFamily: theme.font.bold, color: theme.colors.text },
  error: { fontSize: 14, color: theme.colors.danger, fontFamily: theme.font.medium },
  empty: { alignItems: 'center', gap: 10, marginTop: 40 },
  badge: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#FDECEF', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontFamily: theme.font.semibold, color: theme.colors.text },
  muted: { fontSize: 15, color: theme.colors.textMuted, fontFamily: theme.font.regular, textAlign: 'center' },
  inactive: { fontSize: 13, fontFamily: theme.font.semibold, color: theme.colors.danger },
});
