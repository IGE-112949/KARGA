import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { theme } from '@/theme';

// Mapa decorativo do mockup "AUTENTICAÇÃO · 1".
function MapArt() {
  const pin = (left: number, top: number, size: number, opacity = 1) => (
    <View style={[styles.pin, { left, top, width: size, height: size, borderRadius: size / 2, opacity }]}>
      <Icon name="bolt" size={size / 2} color={theme.colors.white} filled strokeWidth={0} />
    </View>
  );
  return (
    <View style={styles.map}>
      {Array.from({ length: 14 }, (_, i) => <View key={`h${i}`} style={[styles.gridH, { top: i * 32 }]} />)}
      {Array.from({ length: 14 }, (_, i) => <View key={`v${i}`} style={[styles.gridV, { left: i * 32 }]} />)}
      <View style={[styles.road, { left: -40, top: 150, width: 520, height: 14, transform: [{ rotate: '-12deg' }] }]} />
      <View style={[styles.road, { left: 170, top: -40, width: 12, height: 500, transform: [{ rotate: '18deg' }] }]} />
      <View style={[styles.road, { left: -20, top: 290, width: 460, height: 10, transform: [{ rotate: '8deg' }] }]} />
      <View style={styles.water} />
      {pin(70, 90, 44)}
      {pin(260, 60, 36, 0.85)}
      {pin(290, 230, 40)}
      <View style={styles.me} />
    </View>
  );
}

export default function Welcome() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <MapArt />
      <View style={styles.brand}>
        <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Karga" />
        <Text style={styles.tagline}>A tua rede comunitária de carregamento.</Text>
      </View>
      <View style={styles.flex} />
      <View style={styles.actions}>
        <Button title="Entrar" onPress={() => router.push('/login')} />
        <Button title="Criar conta" variant="secondary" style={styles.outline} onPress={() => router.push('/register')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.white, paddingBottom: 32 },
  map: { height: 380, backgroundColor: '#EEF1EC', overflow: 'hidden' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#E2E7E2' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: '#E2E7E2' },
  road: { position: 'absolute', backgroundColor: theme.colors.white },
  water: { position: 'absolute', right: -110, bottom: -160, width: 380, height: 280, borderRadius: 190, backgroundColor: '#CFE2EE' },
  pin: { position: 'absolute', backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', ...theme.shadow.primary },
  me: { position: 'absolute', left: 186, top: 186, width: 18, height: 18, borderRadius: 9, backgroundColor: '#2F80ED', borderWidth: 3, borderColor: theme.colors.white },
  brand: { alignItems: 'center', gap: 16, marginTop: 8, paddingHorizontal: 24 },
  logo: { height: 64, width: 200 },
  tagline: { fontSize: 20, lineHeight: 27, color: theme.colors.textLabel, textAlign: 'center', maxWidth: 280, fontFamily: theme.font.regular },
  flex: { flex: 1 },
  actions: { gap: 12, paddingHorizontal: 24 },
  outline: { borderColor: theme.colors.text },
});
