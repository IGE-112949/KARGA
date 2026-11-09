import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import type { Space } from '@/lib/spaces';
import type { Errors } from '@/lib/validation';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { theme } from '@/theme';
import { WizardHeader } from '@/spaces/WizardHeader';
import {
  draftFromSpace, featuresPatch, locationPatch, pricePatch, validateFeatures, validateLocation, validatePriceSchedule, windowsOf,
  type SpaceDraft,
} from '@/spaces/draft';
import { LocationStep } from '@/spaces/steps/LocationStep';
import { FeaturesStep } from '@/spaces/steps/FeaturesStep';
import { Estimate, PricePart, SchedulePart } from '@/spaces/steps/PriceScheduleStep';

type Section = 'location' | 'features' | 'price' | 'schedule';
const TITLES: Record<Section, string> = {
  location: 'Nome e localização', features: 'Características', price: 'Preço', schedule: 'Disponibilidade semanal',
};

function validateSection(section: Section, d: SpaceDraft): Errors {
  if (section === 'location') return validateLocation(d);
  if (section === 'features') return validateFeatures(d, false);
  const { days, ...price } = validatePriceSchedule(d);
  return section === 'schedule' ? (days ? { days } : {}) : price;
}

// Edita uma parte do espaço reutilizando o passo correspondente do assistente.
export default function EditSpace() {
  const router = useRouter();
  const { id, section = 'location' } = useLocalSearchParams<{ id: string; section?: Section }>();
  const { api } = useAuth();
  const [d, setD] = useState<SpaceDraft | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const set = (p: Partial<SpaceDraft>) => setD((s) => (s ? { ...s, ...p } : s));

  useEffect(() => {
    api.get<Space>(`/me/spaces/${id}`).then((s) => setD(draftFromSpace(s))).catch(() => setError('Não foi possível carregar o espaço.'));
  }, [api, id]);

  const save = async () => {
    if (!d) return;
    setError(null);
    const e = validateSection(section as Section, d);
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      if (section === 'schedule') await api.put(`/me/spaces/${id}/availability`, windowsOf(d));
      else await api.patch(`/me/spaces/${id}`, section === 'location' ? locationPatch(d) : section === 'features' ? featuresPatch(d) : pricePatch(d));
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.details?.[0]?.message ?? err.message : 'Ocorreu um erro. Tenta novamente.');
    }
  };

  const props = d ? { d, set, errors } : null;
  return (
    <Screen background={theme.colors.screenBg}>
      <WizardHeader label="Editar espaço" title={TITLES[section as Section] ?? 'Editar'} onBack={() => router.back()} />
      {!props ? (error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={theme.colors.accent} />) : (
        <>
          {section === 'location' ? <LocationStep {...props} /> : null}
          {section === 'features' ? <FeaturesStep {...props} withPhotos={false} /> : null}
          {section === 'price' ? <><PricePart {...props} /><Estimate d={props.d} /></> : null}
          {section === 'schedule' ? <><SchedulePart {...props} /><Estimate d={props.d} /></> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.flex} />
          <Button title="Guardar" onPress={save} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minHeight: 8 },
  error: { fontSize: 14, color: theme.colors.danger, fontFamily: theme.font.medium, textAlign: 'center' },
});
