import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import { pickSpacePhoto, type PhotoSource } from '@/lib/avatar';
import { pickerMessage } from '@/lib/pickerError';
import { formatEnergy, formatEuro, formatKw, plugLabelOf, scheduleSummary, spaceTypeLabel, type Space } from '@/lib/spaces';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { BackButton } from '@/ui/BackButton';
import { Sheet } from '@/ui/Sheet';
import { theme } from '@/theme';
import { photoFormData } from '@/spaces/form';
import { PhotosSection } from '@/spaces/PhotosSection';
import { BlocksSection } from '@/spaces/BlocksSection';

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : 'Ocorreu um erro. Tenta novamente.');

function Row({ k, v, onEdit }: { k: string; v: string; onEdit: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${k}`} onPress={onEdit} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.flex}>
        <Text style={styles.k}>{k}</Text>
        <Text style={styles.v}>{v}</Text>
      </View>
      <Text style={styles.edit}>Editar</Text>
    </Pressable>
  );
}

export default function ManageSpace() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useAuth();
  const [s, setS] = useState<Space | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingVisible, setPendingVisible] = useState<boolean | null>(null);

  const load = useCallback(() => {
    api.get<Space>(`/me/spaces/${id}`).then(setS).catch((e) => setNotice(errMsg(e)));
  }, [api, id]);
  useFocusEffect(load);

  // Executa uma ação; a resposta (o espaço atualizado) substitui o estado, senão volta a carregar.
  const act = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setNotice(null);
    try {
      const r = await fn();
      if (r && typeof r === 'object' && 'id' in (r as object) && 'photos' in (r as object)) setS(r as Space);
      else load();
      return true;
    } catch (e) {
      setNotice(errMsg(e));
      return false;
    }
  };

  if (!s) {
    return (
      <Screen background={theme.colors.screenBg}>
        <BackButton onPress={() => router.back()} />
        {notice ? <Text style={styles.notice}>{notice}</Text> : <ActivityIndicator color={theme.colors.accent} />}
      </Screen>
    );
  }

  const edit = (section: string) => router.push({ pathname: '/spaces/[id]/edit', params: { id: s.id, section } });
  const visible = pendingVisible ?? s.status === 'active';

  const addPhoto = async (source: PhotoSource) => {
    setNotice(null);
    let p;
    try {
      p = await pickSpacePhoto(source);
    } catch (e) {
      setNotice(pickerMessage(e));
      return;
    }
    if (p) await act(async () => api.upload(`/me/spaces/${s.id}/photos`, await photoFormData(p.uri), 'POST'));
  };

  // O interruptor muda logo; se o pedido falhar volta ao estado anterior (o erro aparece em cima).
  const toggleVisible = async (on: boolean) => {
    setPendingVisible(on);
    await act(() => api.patch(`/me/spaces/${s.id}`, { status: on ? 'active' : 'inactive' }));
    setPendingVisible(null);
  };

  const remove = async () => {
    setConfirmDelete(false);
    try {
      await api.del(`/me/spaces/${s.id}`);
      router.replace('/spaces');
    } catch (e) {
      setNotice(errMsg(e));
    }
  };

  return (
    <Screen background={theme.colors.screenBg} contentStyle={styles.content}>
      <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/spaces'))} />
      <View style={styles.head}>
        <Text style={styles.h1} accessibilityRole="header">{s.title}</Text>
        <Text style={styles.muted}>{[s.address, s.spotDetails].filter(Boolean).join(' · ')}</Text>
      </View>

      {notice ? <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text> : null}

      <View style={[styles.card, styles.switchRow]}>
        <View style={styles.flex}>
          <Text style={styles.v}>Visível no mapa</Text>
          <Text style={styles.k}>{visible ? 'Os condutores podem encontrar e reservar' : 'Escondido: ninguém o vê nem reserva'}</Text>
        </View>
        <Switch accessibilityRole="switch" accessibilityLabel="Visível no mapa" accessibilityState={{ checked: visible }} value={visible}
          onValueChange={(on) => void toggleVisible(on)}
          trackColor={{ true: theme.colors.accent, false: '#D5DCD9' }} thumbColor="#FFFFFF" />
      </View>

      <View style={styles.card}>
        <Row k="Nome e localização" v={s.title} onEdit={() => edit('location')} />
        <Row k="Características" v={`${formatKw(s.powerKw)} · ${plugLabelOf(s.plugType)} · ${spaceTypeLabel(s.spaceType)}`} onEdit={() => edit('features')} />
        <Row k="Preço" v={`${formatEuro(s.pricePerHour)}/hora${s.energyPriceKwh != null ? ` · energia ${formatEnergy(s.energyPriceKwh)}/kWh` : ''}`} onEdit={() => edit('price')} />
        <Row k="Disponibilidade semanal" v={scheduleSummary(s.availability)} onEdit={() => edit('schedule')} />
      </View>

      <Text style={styles.h2}>Fotografias</Text>
      <PhotosSection photos={s.photos} onAdd={addPhoto}
        onCover={async (pid) => { await act(() => api.patch(`/me/spaces/${s.id}/photos/${pid}`, { isCover: true })); }}
        onRemove={async (pid) => { await act(() => api.del(`/me/spaces/${s.id}/photos/${pid}`)); }} />

      <Text style={styles.h2}>Datas bloqueadas</Text>
      <BlocksSection blocks={s.blocks}
        onAdd={(b) => act(() => api.post(`/me/spaces/${s.id}/blocks`, b))}
        onRemove={(bid) => act(() => api.del(`/me/spaces/${s.id}/blocks/${bid}`))} />

      <Button title="Eliminar espaço" variant="danger" onPress={() => setConfirmDelete(true)} />
      <Sheet visible={confirmDelete} title="Eliminar este espaço?" onClose={() => setConfirmDelete(false)}
        message="Deixa de aparecer aos condutores e na tua lista. Se só o queres esconder por uns tempos, usa o interruptor 'Visível no mapa'."
        actions={[{ title: 'Eliminar', variant: 'danger', onPress: remove }]} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 14 },
  flex: { flex: 1 },
  head: { gap: 4 },
  h1: { fontSize: 24, fontFamily: theme.font.bold, color: theme.colors.text },
  h2: { fontSize: 15, fontFamily: theme.font.semibold, color: theme.colors.textLabel, marginTop: 6 },
  muted: { fontSize: 14, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  notice: { fontSize: 14, color: theme.colors.danger, fontFamily: theme.font.medium },
  card: { backgroundColor: theme.colors.white, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEF2F0' },
  pressed: { opacity: 0.85 },
  k: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  v: { fontSize: 15, color: theme.colors.text, fontFamily: theme.font.medium },
  edit: { fontSize: 14, color: theme.colors.link, fontFamily: theme.font.semibold },
});
