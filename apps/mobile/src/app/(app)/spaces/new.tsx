import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { ApiError } from '@/lib/api';
import type { Errors } from '@/lib/validation';
import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { Sheet } from '@/ui/Sheet';
import { theme } from '@/theme';
import { WizardHeader } from '@/spaces/WizardHeader';
import { createPayload, emptyDraft, validateFeatures, validateLocation, validatePriceSchedule, type SpaceDraft } from '@/spaces/draft';
import { spaceFormData } from '@/spaces/form';
import { LocationStep } from '@/spaces/steps/LocationStep';
import { FeaturesStep } from '@/spaces/steps/FeaturesStep';
import { PriceScheduleStep } from '@/spaces/steps/PriceScheduleStep';
import { PlugStep } from '@/spaces/steps/PlugStep';
import { ReviewStep } from '@/spaces/steps/ReviewStep';

const STEPS = [
  { title: 'Onde fica o espaço?', sub: 'A morada só é mostrada ao condutor depois de reservar.' },
  { title: 'Características', sub: 'Ajuda os condutores a saber se o lugar serve o carro deles.' },
  { title: 'Preço e disponibilidade', sub: 'Define quanto cobras e quando o lugar está livre.' },
  { title: 'Tomada inteligente', sub: 'Controla a carga e mede a energia de cada sessão.' },
  { title: 'Rever e publicar', sub: 'Confirma os dados antes de publicar.' },
];

// Assistente "Novo espaço" (5 passos, como no mockup). Publica tudo num só pedido.
export default function NewSpace() {
  const router = useRouter();
  const { api } = useAuth();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<SpaceDraft>(emptyDraft);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const set = (p: Partial<SpaceDraft>) => setD((s) => ({ ...s, ...p }));

  const validators = [() => validateLocation(d), () => validateFeatures(d, true), () => validatePriceSchedule(d), () => ({}), () => ({})];

  const next = () => {
    const e = validators[step]();
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep((s) => s + 1);
  };

  const exit = () => (router.canGoBack() ? router.back() : router.replace('/spaces'));
  const back = () => (step === 0 ? close() : setStep((s) => s - 1));
  const close = () => (d.title || d.address || d.photos.length ? setConfirmClose(true) : exit());

  const publish = async () => {
    setError(null);
    try {
      const form = await spaceFormData(createPayload(d), d.photos);
      const space = await api.upload<{ id: string }>('/me/spaces', form, 'POST');
      router.replace({ pathname: '/spaces/published', params: { id: space.id } });
    } catch (e) {
      // Mostra o motivo real (validação, imagem, rede…) para o proprietário saber o que corrigir.
      const reason = e instanceof ApiError ? e.details?.[0]?.message ?? e.message : null;
      setError(reason ? `Não foi possível publicar: ${reason}` : 'Não foi possível publicar. Tenta novamente.');
    }
  };

  const props = { d, set, errors };
  return (
    <Screen background={theme.colors.screenBg}>
      <WizardHeader label={`Passo ${step + 1} de ${STEPS.length}`} title={STEPS[step].title} sub={STEPS[step].sub} onBack={back} onClose={close} progress={(step + 1) / STEPS.length} />
      {step === 0 ? <LocationStep {...props} /> : null}
      {step === 1 ? <FeaturesStep {...props} /> : null}
      {step === 2 ? <PriceScheduleStep {...props} /> : null}
      {step === 3 ? <PlugStep /> : null}
      {step === 4 ? <ReviewStep d={d} /> : null}
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      <View style={styles.flex} />
      {step < 4 ? <Button title="Continuar" onPress={next} /> : <Button title="Publicar espaço" onPress={publish} />}
      <Sheet visible={confirmClose} title="Sair sem publicar?" message="Os dados que preencheste vão perder-se." onClose={() => setConfirmClose(false)}
        actions={[{ title: 'Sair', variant: 'danger', onPress: () => { setConfirmClose(false); exit(); } }]} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minHeight: 8 },
  error: { fontSize: 14, color: theme.colors.danger, fontFamily: theme.font.medium, textAlign: 'center' },
});
