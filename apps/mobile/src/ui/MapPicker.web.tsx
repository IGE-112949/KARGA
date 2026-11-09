import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/theme';
import type { LatLng } from '@/lib/location';

// A KARGA é uma app Android/iOS: no browser (só para testes) não há mapa.
export function MapPicker({ value, height = 200 }: { value: LatLng | null; onChange: (p: LatLng) => void; height?: number }) {
  return (
    <View style={[styles.box, { height }]}>
      <Text style={styles.text}>Mapa disponível na app</Text>
      {value ? <Text style={styles.small}>{value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 18, backgroundColor: '#E9EDEB', alignItems: 'center', justifyContent: 'center', gap: 4 },
  text: { fontSize: 14, fontFamily: theme.font.medium, color: theme.colors.textMuted },
  small: { fontSize: 12, fontFamily: theme.font.regular, color: theme.colors.textMuted },
});
