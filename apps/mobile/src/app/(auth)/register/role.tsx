import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import { avatarFormData, pickAvatar, type PickedImage } from '@/lib/avatar';
import { validateName } from '@/lib/validation';
import { Screen } from '@/ui/Screen';
import { StepHeader, Heading } from '@/ui/StepHeader';
import { RoleCard } from '@/ui/RoleCard';
import { Avatar } from '@/ui/Avatar';
import { TextField } from '@/ui/TextField';
import { Button } from '@/ui/Button';
import { theme } from '@/theme';

type Role = 'driver' | 'host' | 'both';

// Registo · passo 2 de 3: modo de utilização (+ foto opcional) → cria o perfil na API.
export default function RegisterRole() {
  const router = useRouter();
  const { api, session, refreshProfile, signOut } = useAuth();
  const meta = (session?.user.user_metadata ?? {}) as { full_name?: string; phone?: string | null };
  const [name, setName] = useState(meta.full_name ?? '');
  const [role, setRole] = useState<Role>('driver');
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();

  const choosePhoto = async () => {
    const p = await pickAvatar();
    if (p) setPhoto(p);
  };

  const submit = async () => {
    setError(null);
    const ne = validateName(name);
    setNameError(ne);
    if (ne) return;
    const isDriver = role !== 'host';
    const isHost = role !== 'driver';
    try {
      await api.post('/me', { fullName: name.trim(), phone: meta.phone || undefined, isDriver, isHost, acceptTerms: true });
    } catch (e) {
      // PROFILE_EXISTS: o perfil já foi criado numa tentativa anterior — segue em frente.
      if (!(e instanceof ApiError && e.code === 'PROFILE_EXISTS')) {
        setError(e instanceof ApiError ? e.details?.[0]?.message ?? e.message : 'Ocorreu um erro. Tenta novamente.');
        return;
      }
    }
    if (photo) {
      try {
        await api.upload('/me/avatar', await avatarFormData(photo.uri));
      } catch {
        Alert.alert('Foto não guardada', 'A conta foi criada. Podes adicionar a foto mais tarde no Perfil.');
      }
    }
    await refreshProfile();
    router.replace(isDriver ? '/register/vehicle' : '/profile');
  };

  return (
    <Screen>
      {/* Voltar cancela o registo: a conta já existe, por isso termina a sessão. */}
      <StepHeader step={2} onBack={() => void signOut()} />
      <Heading title="Como vais usar a Karga?" sub="Podes mudar de modo a qualquer momento no Perfil." />
      <View style={styles.photo}>
        <Avatar uri={photo?.uri} name={name || '?'} size={72} editable onPress={choosePhoto} />
        <Button title={photo ? 'Alterar foto' : 'Adicionar foto'} variant="text" onPress={choosePhoto} />
      </View>
      {!meta.full_name ? (
        <TextField label="Nome completo" placeholder="Nome e apelido" value={name} onChangeText={setName} error={nameError} />
      ) : null}
      <View style={styles.roles} accessibilityRole="radiogroup" accessibilityLabel="Perfil de utilização">
        <RoleCard title="Condutor" description="Encontrar e reservar lugares com carregamento perto de mim." icon="car"
          selected={role === 'driver'} onPress={() => setRole('driver')} />
        <RoleCard title="Proprietário" description="Alugar o meu lugar de estacionamento com tomada." icon="home"
          selected={role === 'host'} onPress={() => setRole('host')} />
        <RoleCard title="Ambos" description="Carrego o meu carro e também alugo o meu espaço." icon="swap"
          selected={role === 'both'} onPress={() => setRole('both')} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.flex} />
      <Button title="Continuar" onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roles: { gap: 12 },
  error: { fontSize: 13, color: theme.colors.danger, fontFamily: theme.font.medium },
  flex: { flex: 1 },
});
