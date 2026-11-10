import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { useMode } from '@/profile/ModeContext';
import { ApiError } from '@/lib/api';
import { avatarFormData, pickAvatar } from '@/lib/avatar';
import { formatPhone } from '@/lib/validation';
import { Screen } from '@/ui/Screen';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { MenuRow, menuCard } from '@/ui/MenuRow';
import { Icon } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';
import { theme } from '@/theme';

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : 'Ocorreu um erro. Tenta novamente.');

export default function ProfileScreen() {
  const router = useRouter();
  const { api, profile, session, refreshProfile, signOut } = useAuth();
  const { mode, setMode } = useMode();
  const [photoSheet, setPhotoSheet] = useState(false);
  const [activateSheet, setActivateSheet] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  if (!profile) return null;

  const isHostMode = mode === 'host';
  const other = isHostMode ? 'driver' : 'host';
  const otherLabel = isHostMode ? 'Modo Condutor' : 'Modo Proprietário';
  const hasOther = isHostMode ? profile.isDriver : profile.isHost;

  // Ativar um modo novo pede confirmação (evita toques acidentais); mudar entre modos já ativos é imediato.
  const switchMode = () => {
    setNotice(null);
    if (hasOther) setMode(other);
    else setActivateSheet(true);
  };

  const activateOther = async () => {
    setActivateSheet(false);
    try {
      await api.patch('/me', isHostMode ? { isDriver: true } : { isHost: true });
      await refreshProfile();
    } catch (e) {
      setNotice(errMsg(e));
      return;
    }
    setMode(other);
  };

  const changePhoto = async () => {
    setPhotoSheet(false);
    const p = await pickAvatar();
    if (!p) return;
    try {
      await api.upload('/me/avatar', await avatarFormData(p.uri));
      await refreshProfile();
    } catch (e) {
      setNotice(errMsg(e));
    }
  };

  const removePhoto = async () => {
    setPhotoSheet(false);
    try {
      await api.del('/me/avatar');
      await refreshProfile();
    } catch (e) {
      setNotice(errMsg(e));
    }
  };

  const def = profile.vehicles.find((v) => v.isDefault) ?? profile.vehicles[0];

  return (
    <Screen background={theme.colors.screenBg} contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.h1} accessibilityRole="header">Perfil</Text>
        <Text style={[styles.modeBadge, isHostMode ? styles.modeHost : styles.modeDriver]}>
          {isHostMode ? 'Modo Proprietário' : 'Modo Condutor'}
        </Text>
      </View>

      <View style={[styles.card, styles.identity]}>
        <Avatar uri={profile.avatarUrl} name={profile.fullName} size={84} editable onPress={() => setPhotoSheet(true)} />
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.muted}>{session?.user.email}</Text>
        {profile.phone ? <Text style={styles.muted}>{formatPhone(profile.phone)}</Text> : null}
      </View>

      {notice ? <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text> : null}

      <Pressable accessibilityRole="button" accessibilityLabel={`${hasOther ? 'Mudar para' : 'Ativar'} ${otherLabel}`}
        onPress={switchMode} style={({ pressed }) => [styles.modeCard, pressed && styles.pressed]}>
        <View style={styles.modeIcon}><Icon name="swap" size={22} color={theme.colors.white} /></View>
        <View style={styles.rowText}>
          <Text style={styles.modeTitle}>{hasOther ? 'Mudar para' : 'Ativar'} {otherLabel}</Text>
          <Text style={styles.modeSub}>{isHostMode ? 'Encontra e reserva lugares' : 'Aluga o teu lugar com tomada'}</Text>
        </View>
        <Icon name="chevron" size={20} color="#B9C6D1" />
      </Pressable>

      <View style={menuCard}>
        <MenuRow icon="card" title="Métodos de Pagamento" sub="Cartão e MB WAY" badge="Em breve" />
        <MenuRow icon="car" title="Os meus veículos" sub={def ? `${def.makeModel} · ${def.plate}` : 'Nenhum veículo'}
          onPress={() => router.push('/profile/vehicles')} />
        <MenuRow icon="heart" title="Os meus favoritos" iconBg="#FDECEF" iconColor="#E11D48"
          onPress={() => router.push('/profile/favorites')} />
        <MenuRow icon="settings" title="Definições" iconBg={theme.colors.surface} iconColor={theme.colors.textLabel} last
          onPress={() => router.push('/profile/settings')} />
      </View>

      <View style={styles.flex} />
      <Button title="Terminar sessão" onPress={signOut} style={styles.logout} icon={<Icon name="logout" size={20} color={theme.colors.white} />} />

      <Sheet visible={photoSheet} title="Foto de perfil" onClose={() => setPhotoSheet(false)}
        actions={[
          { title: profile.avatarUrl ? 'Alterar foto' : 'Adicionar foto', onPress: changePhoto, variant: 'primary' },
          ...(profile.avatarUrl ? [{ title: 'Remover foto', onPress: removePhoto, variant: 'danger' as const }] : []),
        ]} />
      <Sheet visible={activateSheet} title={`Ativar ${otherLabel}?`} onClose={() => setActivateSheet(false)}
        message={isHostMode
          ? 'Vais poder procurar e reservar lugares com carregamento. Podes voltar ao Modo Proprietário a qualquer momento.'
          : 'Vais poder anunciar o teu lugar de estacionamento com tomada. Podes voltar ao Modo Condutor a qualquer momento.'}
        actions={[{ title: 'Ativar', onPress: activateOther, variant: 'primary' }]} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 26, fontFamily: theme.font.bold, color: theme.colors.text },
  modeBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, overflow: 'hidden', fontSize: 12, fontFamily: theme.font.semibold },
  modeDriver: { backgroundColor: theme.colors.greenBg, color: theme.colors.greenText },
  modeHost: { backgroundColor: theme.colors.navy, color: theme.colors.white },
  card: { backgroundColor: theme.colors.white, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  identity: { alignItems: 'center', gap: 6, paddingVertical: 22, paddingHorizontal: 16, borderRadius: 22 },
  name: { fontSize: 20, fontFamily: theme.font.semibold, color: theme.colors.text, marginTop: 6 },
  muted: { fontSize: 14, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  notice: { fontSize: 14, color: theme.colors.textLabel, fontFamily: theme.font.medium, textAlign: 'center' },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: theme.colors.navy,
    shadowColor: theme.colors.navy, shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  modeIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { fontSize: 17, fontFamily: theme.font.semibold, color: theme.colors.white },
  modeSub: { fontSize: 13, color: '#B9C6D1', fontFamily: theme.font.regular },
  rowText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.85 },
  flex: { flexGrow: 1, minHeight: 8 },
  logout: { backgroundColor: theme.colors.dangerBorder, height: 54, shadowColor: theme.colors.dangerBorder, shadowOpacity: 0.25 },
});
