import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { resetTo } from '@/lib/navigation';
import { noticeFor } from '@/lib/notices';
import { useAuth } from '@/auth/AuthProvider';
import { normalizePlate } from '@/lib/plate';
import { apiFieldErrors, validateVehicle, type Errors } from '@/lib/validation';
import { Screen } from '@/ui/Screen';
import { StepHeader, Heading } from '@/ui/StepHeader';
import { VehicleFields, type VehicleForm } from '@/ui/VehicleFields';
import { Icon } from '@/ui/Icon';
import { Button } from '@/ui/Button';
import { theme } from '@/theme';

// Registo · passo 3 de 3: veículo (opcional). Sem "voltar": o perfil já foi criado no passo 2.
export default function RegisterVehicle() {
  const { api, refreshProfile } = useAuth();
  const notice = noticeFor(useLocalSearchParams<{ aviso?: string }>().aviso);
  const [v, setV] = useState<VehicleForm>({ makeModel: '', plate: '', plugType: null });
  const [errors, setErrors] = useState<Errors>({});

  const submit = async () => {
    const e = validateVehicle(v);
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await api.post('/me/vehicles', { makeModel: v.makeModel.trim(), plate: normalizePlate(v.plate), plugType: v.plugType });
    } catch (err) {
      setErrors(apiFieldErrors(err));
      return;
    }
    await refreshProfile();
    resetTo('/profile');
  };

  return (
    <Screen>
      <StepHeader step={3} />
      <View style={styles.badge}><Icon name="car" size={30} color={theme.colors.link} /></View>
      <Heading title="Qual é o teu veículo?" sub="Usamos estes dados para mostrar só os lugares compatíveis com o teu carro." />
      {notice ? <Text style={styles.notice} accessibilityLiveRegion="polite">{notice}</Text> : null}
      <VehicleFields value={v} onChange={setV} errors={errors} />
      {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
      <View style={styles.flex} />
      <View style={styles.actions}>
        <Button title="Começar a usar a Karga" onPress={submit} />
        <Button title="Saltar por agora" variant="text" onPress={() => resetTo('/profile')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { fontSize: 14, color: theme.colors.textLabel, fontFamily: theme.font.medium, backgroundColor: theme.colors.surface, padding: 12, borderRadius: 12, overflow: 'hidden' },
  badge: { width: 64, height: 64, borderRadius: 20, backgroundColor: theme.colors.greenBg, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 13, color: theme.colors.danger, fontFamily: theme.font.medium },
  flex: { flex: 1 },
  actions: { gap: 6 },
});
