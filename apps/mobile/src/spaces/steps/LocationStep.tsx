import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TextField } from '@/ui/TextField';
import { Icon } from '@/ui/Icon';
import { MapPicker } from '@/ui/MapPicker';
import { addressAt, currentPlace, geocodeAddress, LocationPermissionError, type LatLng } from '@/lib/location';
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
    try {
      const p = await geocodeAddress(a);
      if (p) {
        lastGeocoded.current = a;
        setWarning(null);
        set({ point: p });
        addressAt(p).then((pl) => pl?.area && set({ area: pl.area })).catch(() => undefined);
      } else {
        setWarning('Não encontrámos esta morada. Ajusta o pin no mapa.');
      }
    } catch {
      setWarning('Sem acesso à localização: marca o lugar tocando no mapa.');
    }
  };

  // Mover o pin (arrastar ou tocar no mapa) atualiza a morada para a do novo sítio.
  const movePin = async (point: LatLng) => {
    set({ point });
    setWarning(null);
    try {
      const a = await addressAt(point);
      if (a?.address) {
        lastGeocoded.current = a.address;
        set({ address: a.address, area: a.area ?? '' });
      }
    } catch {
      // sem permissão: o pin fica onde o utilizador o pôs e a morada escrita mantém-se
    }
  };

  const useCurrent = async () => {
    setWarning(null);
    try {
      const p = await currentPlace();
      if (p.address) lastGeocoded.current = p.address;
      set({ point: { latitude: p.latitude, longitude: p.longitude }, ...(p.address ? { address: p.address, area: p.area ?? '' } : {}) });
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
      <MapPicker value={d.point} onChange={movePin} />
      <FieldError>{errors.point}</FieldError>
      {warning ? <Text style={styles.warning}>{warning}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Usar a minha localização atual" onPress={useCurrent} hitSlop={8} style={styles.locate}>
        <Icon name="locate" size={18} color={theme.colors.link} />
        <Text style={styles.locateText}>Usar a minha localização atual</Text>
      </Pressable>
      <TextField label="Piso e número do lugar" placeholder="ex.: Piso -1 · Lugar 14" value={d.spotDetails} error={errors.spotDetails}
        onChangeText={(spotDetails) => set({ spotDetails })} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  locate: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 4 },
  locateText: { fontSize: 15, fontFamily: theme.font.semibold, color: theme.colors.link },
  warning: { fontSize: 13, color: '#9A6B00', fontFamily: theme.font.medium },
});
