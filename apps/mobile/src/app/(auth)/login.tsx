import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { authErrorMessage } from '@/lib/authErrors';
import { Screen } from '@/ui/Screen';
import { BackButton } from '@/ui/BackButton';
import { TextField } from '@/ui/TextField';
import { Button } from '@/ui/Button';
import { theme } from '@/theme';

export function GoogleSoon() {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Continuar com Google (em breve)" accessibilityState={{ disabled: true }} disabled style={styles.google}>
      <Text style={styles.googleText}>Continuar com Google</Text>
      <Text style={styles.soon}>Em breve</Text>
    </Pressable>
  );
}

export function OrDivider() {
  return (
    <View style={styles.or}>
      <View style={styles.line} />
      <Text style={styles.orText}>ou</Text>
      <View style={styles.line} />
    </View>
  );
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);

  const submit = async () => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    // Com sucesso, o AuthProvider muda o estado e a navegação segue sozinha; até lá o botão continua a carregar.
    if (err) setError(authErrorMessage(err));
    else setEntering(true);
  };

  return (
    <Screen contentStyle={styles.content}>
      <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
      <View style={styles.head}>
        <Text style={styles.title}>Bem-vindo de volta</Text>
        <Text style={styles.sub}>Entra para encontrar lugares com carregamento perto de ti.</Text>
      </View>
      <View style={styles.fields}>
        <TextField label="Email" value={email} onChangeText={setEmail} placeholder="nome@email.pt" keyboardType="email-address"
          autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
        <TextField label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry
          autoComplete="current-password" textContentType="password" />
      </View>
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      <Button title="Entrar" onPress={submit} loading={entering} disabled={!email.trim() || !password} />
      <OrDivider />
      <GoogleSoon />
      <View style={styles.switch}>
        <Text style={styles.switchQ}>Ainda não tens conta?</Text>
        <Pressable accessibilityRole="link" onPress={() => router.replace('/register')} hitSlop={8}>
          <Text style={styles.switchLink}>Criar conta</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 22 },
  head: { gap: 6 },
  title: { fontSize: 28, fontFamily: theme.font.bold, color: theme.colors.text },
  sub: { fontSize: 15, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  fields: { gap: 16 },
  error: { fontSize: 14, color: theme.colors.danger, fontFamily: theme.font.medium, marginTop: -8 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: theme.colors.divider },
  orText: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  google: {
    height: 52, borderRadius: theme.radius.button, borderWidth: 1.5, borderColor: theme.colors.fieldBorder, backgroundColor: theme.colors.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.6,
  },
  googleText: { fontSize: 16, fontFamily: theme.font.medium, color: theme.colors.text },
  soon: { fontSize: 12, fontFamily: theme.font.semibold, color: theme.colors.greenText, backgroundColor: theme.colors.greenBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, overflow: 'hidden' },
  switch: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  switchQ: { fontSize: 14, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  switchLink: { fontSize: 14, color: theme.colors.link, fontFamily: theme.font.semibold },
});
