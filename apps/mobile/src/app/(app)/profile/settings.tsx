import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import { config } from '@/lib/config';
import { apiFieldErrors, formatPhone, normalizePhone, validateName, validatePhone, type Errors } from '@/lib/validation';
import { Screen } from '@/ui/Screen';
import { BackButton } from '@/ui/BackButton';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';
import { MenuRow, menuCard } from '@/ui/MenuRow';
import { Sheet } from '@/ui/Sheet';
import { theme } from '@/theme';

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : 'Ocorreu um erro. Tenta novamente.');

export default function SettingsScreen() {
  const router = useRouter();
  const { api, profile, session, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.fullName ?? '');
  const [phone, setPhone] = useState(formatPhone(profile?.phone));
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteSheet, setDeleteSheet] = useState(false);

  useEffect(() => {
    setName(profile?.fullName ?? '');
    setPhone(formatPhone(profile?.phone));
  }, [profile?.fullName, profile?.phone]);

  if (!profile) return null;

  const dirty = name.trim() !== profile.fullName || normalizePhone(phone) !== (profile.phone ?? '');
  const saveDetails = async () => {
    setNotice(null);
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

  const open = (path: string) => { Linking.openURL(`${config.siteUrl}/${path}`).catch(() => {}); };

  return (
    <Screen background={theme.colors.screenBg} contentStyle={styles.content}>
      <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />
      <Text style={styles.h1} accessibilityRole="header">Definições</Text>

      <View style={styles.section}>
        <Text style={styles.h2}>Dados pessoais</Text>
        <View style={[menuCard, styles.form]}>
          <TextField label="Nome completo" value={name} onChangeText={setName} error={errors.fullName} autoComplete="name" />
          <TextField label="Telemóvel" value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad"
            placeholder="912 345 678" autoComplete="tel" />
          <View style={styles.readonly}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{session?.user.email}</Text>
          </View>
          {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
          {notice ? <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text> : null}
          <Button title="Guardar alterações" variant="secondary" disabled={!dirty} onPress={saveDetails} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Informação legal</Text>
        <View style={menuCard}>
          <MenuRow icon="file" title="Termos e Condições" onPress={() => open('termos')} />
          <MenuRow icon="lock" title="Política de Privacidade" last onPress={() => open('privacidade')} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>Conta</Text>
        <View style={menuCard}>
          <MenuRow icon="trash" title="Apagar conta" danger iconBg="#FDECEC" iconColor={theme.colors.danger} last
            onPress={() => setDeleteSheet(true)} />
        </View>
      </View>

      <Sheet visible={deleteSheet} title="Apagar conta?" onClose={() => setDeleteSheet(false)}
        message="Esta ação apaga a tua conta e todos os teus dados. Não pode ser desfeita."
        actions={[{ title: 'Apagar definitivamente', onPress: deleteAccount, variant: 'danger' }]} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 18 },
  h1: { fontSize: 26, fontFamily: theme.font.bold, color: theme.colors.text },
  h2: { fontSize: 15, fontFamily: theme.font.semibold, color: theme.colors.textLabel, marginLeft: 4 },
  section: { gap: 8 },
  form: { padding: 16, gap: 14 },
  readonly: { gap: 4 },
  label: { fontSize: 14, fontFamily: theme.font.medium, color: theme.colors.textLabel },
  value: { fontSize: 16, fontFamily: theme.font.regular, color: theme.colors.textMuted },
  error: { fontSize: 13, color: theme.colors.danger, fontFamily: theme.font.medium },
  notice: { fontSize: 14, color: theme.colors.greenText, fontFamily: theme.font.medium },
});
