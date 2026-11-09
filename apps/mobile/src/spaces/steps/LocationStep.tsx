import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TextField } from '@/ui/TextField';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { MapPicker } from '@/ui/MapPicker';
import { currentPlace, geocodeAddress, LocationPermissionError } from '@/lib/location';
import type { Errors } from '@/lib/validation';
import { theme } from '@/theme';
import type { SpaceDraft } from '../draft';
import { FieldError } from '../ui';

export function LocationStep({ d, set, errors }: { d: SpaceDraft; set: (p: Partial<SpaceDraft>) => void; errors: Errors }) {
  const [warning, setWarning] = useState<string | null>(null);
  const lastGeocoded = useRef(d.address.trim());

  // A morada move o pin quando o campo perde o foco (não a cada letra).
  const geocode = async () => {
    const a = d.address.trim();
    if (a.length < 5 || a === lastGeocoded.current) return;
    lastGeocoded.current = a;
    const p = await geocodeAddress(a);
    if (p) {
      setWarning(null);
      set({ point: p });
    } else {
      setWarning('Não encontrámos esta morada. Ajusta o pin no mapa.');
    }
  };

  const useCurrent = async () => {
    setWarning(null);
    try {
      const p = await currentPlace();
      if (p.address) lastGeocoded.current = p.address;
      set({ point: { latitude: p.latitude, longitude: p.longitude }, ...(p.address ? { address: p.address } : {}) });
    } catch (e) {
      setWarning(e instanceof LocationPermissionError
        ? 'Sem acesso à localização. Escreve a morada.'
        : 'Não foi possível obter a localização. Escreve a morada.');
    }
  };

  return (
    <View style={styles.wrap}>
      <TextField label="Nome do espaço" placeholder="ex.: Garagem da Saraiva" value={d.title} error={errors.title}
        onChangeText={(title) => set({ title })} />
      <TextField label="Morada" placeholder="Rua, número, localidade" value={d.address} error={errors.address}
        autoComplete="street-address" textContentType="fullStreetAddress" onChangeText={(address) => set({ address })} onBlur={geocode} />
      <MapPicker value={d.point} onChange={(point) => set({ point })} />
      <FieldError>{errors.point}</FieldError>
      {warning ? <Text style={styles.warning}>{warning}</Text> : null}
      <Button title="Usar a minha localização atual" variant="secondary" onPress={useCurrent}
        icon={<Icon name="locate" size={18} color={theme.colors.text} />} />
      <TextField label="Piso e número do lugar" placeholder="ex.: Piso -1 · Lugar 14" value={d.spotDetails} error={errors.spotDetails}
        onChangeText={(spotDetails) => set({ spotDetails })} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  warning: { fontSize: 13, color: '#9A6B00', fontFamily: theme.font.medium },
});
