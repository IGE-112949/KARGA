import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { normalizePlate } from '@/lib/plate';
import { apiFieldErrors, validateVehicle, type Errors } from '@/lib/validation';
import { Screen } from '@/ui/Screen';
import { BackButton } from '@/ui/BackButton';
import { Heading } from '@/ui/StepHeader';
import { VehicleFields, type VehicleForm } from '@/ui/VehicleFields';
import { Button } from '@/ui/Button';
import { Sheet } from '@/ui/Sheet';
import { theme } from '@/theme';

// Adicionar (sem id) ou editar um veículo do perfil.
export default function VehicleFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { api, profile, refreshProfile } = useAuth();
  const existing = profile?.vehicles.find((v) => v.id === id);
  const [v, setV] = useState<VehicleForm>(existing
    ? { makeModel: existing.makeModel, plate: existing.plate, plugType: existing.plugType }
    : { makeModel: '', plate: '', plugType: null });
  const [errors, setErrors] = useState<Errors>({});
  const [confirmRemove, setConfirmRemove] = useState(false);

  const done = async () => {
    await refreshProfile();
    router.back();
  };

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (err) {
      setConfirmRemove(false);
      setErrors(apiFieldErrors(err));
      return;
    }
    await done();
  };

  const save = async () => {
    const e = validateVehicle(v);
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = { makeModel: v.makeModel.trim(), plate: normalizePlate(v.plate), plugType: v.plugType };
    await run(() => (existing ? api.patch(`/me/vehicles/${existing.id}`, body) : api.post('/me/vehicles', body)));
  };

  if (id && !existing) {
    return (
      <Screen background={theme.colors.screenBg}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.error}>Este veículo já não existe.</Text>
      </Screen>
    );
  }

  return (
    <Screen background={theme.colors.screenBg}>
      <BackButton onPress={() => router.back()} />
      <Heading title={existing ? 'Editar veículo' : 'Adicionar veículo'} sub="Usamos estes dados para mostrar só os lugares compatíveis com o teu carro." />
      <VehicleFields value={v} onChange={setV} errors={errors} />
      {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
      <View style={styles.flex} />
      <View style={styles.actions}>
        <Button title="Guardar" onPress={save} />
        {existing && !existing.isDefault ? (
          <Button title="Definir como predefinido" variant="secondary" onPress={() => run(() => api.patch(`/me/vehicles/${existing.id}`, { isDefault: true }))} />
        ) : null}
        {existing ? <Button title="Remover" variant="danger" onPress={() => setConfirmRemove(true)} /> : null}
      </View>
      <Sheet visible={confirmRemove} title="Remover veículo?" message={existing ? `${existing.makeModel} · ${existing.plate}` : undefined}
        onClose={() => setConfirmRemove(false)}
        actions={[{ title: 'Remover', variant: 'danger', onPress: () => run(() => api.del(`/me/vehicles/${existing!.id}`)) }]} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: 13, color: theme.colors.danger, fontFamily: theme.font.medium },
  flex: { flex: 1 },
  actions: { gap: 10 },
});
