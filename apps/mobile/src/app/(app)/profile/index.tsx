import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { useMode } from '@/profile/ModeContext';
import { ApiError } from '@/lib/api';
import { avatarFormData, pickAvatar } from '@/lib/avatar';
import { apiFieldErrors, formatPhone, normalizePhone, validateName, validatePhone, type Errors } from '@/lib/validation';
import type { Vehicle } from '@/lib/types';
import { Screen } from '@/ui/Screen';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';
import { Icon } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';
import { plugLabel } from '@/ui/VehicleFields';
import { theme } from '@/theme';

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : 'Ocorreu um erro. Tenta novamente.');

function VehicleRow({ v, onPress }: { v: Vehicle; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${v.makeModel}, ${v.plate}${v.isDefault ? ', Predefinido' : ''}`}
      onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.colors.greenBg }]}><Icon name="car" size={20} color={theme.colors.link} /></View>
      <View style={styles.rowText}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowTitle}>{v.plate}</Text>
          {v.isDefault ? <Text style={styles.defaultBadge}>Predefinido</Text> : null}
        </View>
        <Text style={styles.rowSub}>{v.makeModel} · {plugLabel(v.plugType)}</Text>
      </View>
      <Icon name="chevron" size={20} color={theme.colors.textMuted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { api, profile, session, refreshProfile, signOut } = useAuth();
  const { mode, setMode } = useMode();
  const [photoSheet, setPhotoSheet] = useState(false);
  const [deleteSheet, setDeleteSheet] = useState(false);
  const [activateSheet, setActivateSheet] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState(profile?.fullName ?? '');
  const [phone, setPhone] = useState(formatPhone(profile?.phone));
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    setName(profile?.fullName ?? '');
    setPhone(formatPhone(profile?.phone));
  }, [profile?.fullName, profile?.phone]);

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

  const dirty = name.trim() !== profile.fullName || normalizePhone(phone) !== (profile.phone ?? '');
  const saveDetails = async () => {
    const e: Errors = {};
    const ne = validateName(name);
    const pe = validatePhone(phone);
    if (ne) e.fullName = ne;
    if (pe) e.phone = pe;
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await api.patch('/me', { fullName: name.trim(), phone: normalizePhone(phone) || null });
      await refreshProfile();
      setNotice('Dados guardados.');
    } catch (err) {
      setErrors(apiFieldErrors(err));
    }
  };

  const deleteAccount = async () => {
    try {
      await api.del('/me');
    } catch (e) {
      setDeleteSheet(false);
      setNotice(errMsg(e));
      return;
    }
    setDeleteSheet(false);
    await signOut();
  };

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

      {profile.isDriver ? (
        <View style={styles.section}>
          <Text style={styles.h2}>Os meus veículos</Text>
          <View style={styles.card}>
            {profile.vehicles.length === 0 ? <Text style={[styles.muted, styles.empty]}>Ainda não adicionaste nenhum veículo.</Text> : null}
            {profile.vehicles.map((v) => (
              <VehicleRow key={v.id} v={v} onPress={() => router.push({ pathname: '/profile/vehicle-form', params: { id: v.id } })} />
            ))}
            <Pressable accessibilityRole="button" onPress={() => router.push('/profile/vehicle-form')} style={({ pressed }) => [styles.row, styles.rowLast, pressed && styles.pressed]}>
              <View style={[styles.rowIcon, { backgroundColor: theme.colors.surface }]}><Icon name="plus" size={20} color={theme.colors.textLabel} /></View>
              <Text style={[styles.rowTitle, styles.rowText]}>Adicionar veículo</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {profile.isDriver ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Os meus favoritos" onPress={() => router.push('/profile/favorites')}
          style={({ pressed }) => [styles.card, styles.row, styles.rowLast, pressed && styles.pressed]}>
          <View style={[styles.rowIcon, { backgroundColor: '#FDECEF' }]}><Icon name="heart" size={20} color="#E11D48" filled /></View>
          <Text style={[styles.rowTitle, styles.rowText]}>Os meus favoritos</Text>
          <Icon name="chevron" size={20} color={theme.colors.textMuted} />
        </Pressable>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.h2}>Dados pessoais</Text>
        <View style={[styles.card, styles.form]}>
          <TextField label="Nome completo" value={name} onChangeText={setName} error={errors.fullName} autoComplete="name" />
          <TextField label="Telemóvel" value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad"
            placeholder="912 345 678" autoComplete="tel" />
          {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
          <Button title="Guardar alterações" variant="secondary" disabled={!dirty} onPress={saveDetails} />
        </View>
      </View>

      <Button title="Terminar sessão" onPress={signOut} style={styles.logout} icon={<Icon name="logout" size={20} color={theme.colors.white} />} />
      <Button title="Apagar conta" variant="text" onPress={() => setDeleteSheet(true)} style={styles.deleteBtn} />

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
      <Sheet visible={deleteSheet} title="Apagar conta?" onClose={() => setDeleteSheet(false)}
        message="Esta ação apaga a tua conta e todos os teus dados. Não pode ser desfeita."
        actions={[{ title: 'Apagar definitivamente', onPress: deleteAccount, variant: 'danger' }]} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 26, fontFamily: theme.font.bold, color: theme.colors.text },
  h2: { fontSize: 15, fontFamily: theme.font.semibold, color: theme.colors.textLabel, marginLeft: 4 },
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
  section: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 16, minHeight: 64, borderBottomWidth: 1, borderBottomColor: '#EEF2F0' },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontSize: 16, fontFamily: theme.font.medium, color: theme.colors.text },
  rowSub: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  defaultBadge: { fontSize: 11, fontFamily: theme.font.semibold, color: theme.colors.greenText, backgroundColor: theme.colors.greenBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  empty: { padding: 16 },
  form: { padding: 16, gap: 14 },
  error: { fontSize: 13, color: theme.colors.danger, fontFamily: theme.font.medium },
  pressed: { opacity: 0.85 },
  logout: { backgroundColor: theme.colors.dangerBorder, height: 54, shadowColor: theme.colors.dangerBorder, shadowOpacity: 0.25 },
  deleteBtn: { marginTop: -8 },
});
