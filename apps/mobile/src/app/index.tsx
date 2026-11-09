import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/ui/Button';
import { theme } from '@/theme';

export default function Index() {
  const { status, error, retry, signOut } = useAuth();
  if (status === 'signedOut') return <Redirect href="/welcome" />;
  if (status === 'onboarding') return <Redirect href="/register/role" />;
  if (status === 'ready') return <Redirect href="/profile" />;
  return (
    <View style={styles.wrap}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Karga" />
      {status === 'error' ? (
        <View style={styles.error}>
          <Text style={styles.msg}>{error?.message ?? 'Ocorreu um erro. Tenta novamente.'}</Text>
          <Button title="Tentar novamente" onPress={retry} />
          <Button title="Terminar sessão" variant="text" onPress={signOut} />
        </View>
      ) : (
        <ActivityIndicator color={theme.colors.accent} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, padding: 24, backgroundColor: theme.colors.white },
  logo: { height: 64, width: 200 },
  error: { alignSelf: 'stretch', gap: 12 },
  msg: { textAlign: 'center', fontSize: 15, color: theme.colors.textMuted, fontFamily: theme.font.regular },
});
