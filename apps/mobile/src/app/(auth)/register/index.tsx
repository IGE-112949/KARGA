import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { authErrorMessage } from '@/lib/authErrors';
import { normalizePhone, validateRegister, type Errors } from '@/lib/validation';
import { Screen } from '@/ui/Screen';
import { StepHeader, Heading } from '@/ui/StepHeader';
import { TextField } from '@/ui/TextField';
import { Checkbox } from '@/ui/Checkbox';
import { Button } from '@/ui/Button';
import { theme } from '@/theme';

// Registo · passo 1 de 3: cria a conta na Supabase Auth (nome e telemóvel ficam no user_metadata).
export default function RegisterAccount() {
  const router = useRouter();
  const [f, setF] = useState({ fullName: '', email: '', phone: '', password: '', acceptTerms: false });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    setFormError(null);
    const e = validateRegister(f);
    setErrors(e);
    if (Object.keys(e).length) return;
    const phone = normalizePhone(f.phone);
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim().toLowerCase(),
      password: f.password,
      options: { data: { full_name: f.fullName.trim(), phone: phone || null } },
    });
    if (error) return setFormError(authErrorMessage(error));
    if (!data.session) return setFormError('Enviámos-te um email de confirmação. Confirma o email e depois entra.');
    router.replace('/register/role');
  };

  return (
    <Screen>
      <StepHeader step={1} onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
      <Heading title="Criar conta" sub="Junta-te à rede comunitária de carregamento." />
      <View style={styles.fields}>
        <TextField label="Nome completo" placeholder="Nome e apelido" autoComplete="name" textContentType="name"
          value={f.fullName} onChangeText={set('fullName')} error={errors.fullName} />
        <TextField label="Email" placeholder="nome@email.pt" keyboardType="email-address" autoCapitalize="none" autoComplete="email"
          textContentType="emailAddress" value={f.email} onChangeText={set('email')} error={errors.email} />
        <TextField label="Telemóvel" placeholder="912 345 678" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber"
          value={f.phone} onChangeText={set('phone')} error={errors.phone} />
        <TextField label="Password" placeholder="••••••••" secureTextEntry autoComplete="new-password" textContentType="newPassword"
          value={f.password} onChangeText={set('password')} error={errors.password} hint="Mínimo 8 caracteres, com letras e números." />
      </View>
      <View style={styles.terms}>
        <Checkbox checked={f.acceptTerms} onToggle={() => setF((s) => ({ ...s, acceptTerms: !s.acceptTerms }))}>
          <Text style={styles.termsText}>
            Li e aceito os <Text style={styles.strong}>Termos de Utilização</Text> e a <Text style={styles.strong}>Política de Privacidade</Text>, incluindo o tratamento dos meus dados segundo o RGPD.
          </Text>
        </Checkbox>
        {errors.acceptTerms ? <Text style={styles.error}>{errors.acceptTerms}</Text> : null}
      </View>
      {formError ? <Text style={styles.error} accessibilityLiveRegion="polite">{formError}</Text> : null}
      <View style={styles.flex} />
      <Button title="Criar conta" onPress={submit} style={!f.acceptTerms ? styles.dim : undefined} />
      <View style={styles.switch}>
        <Text style={styles.switchQ}>Já tens conta?</Text>
        <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.replace('/login')}>
          <Text style={styles.switchLink}>Entrar</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 14 },
  terms: { gap: 6 },
  termsText: { flex: 1, fontSize: 14, lineHeight: 20, color: theme.colors.textLabel, fontFamily: theme.font.regular },
  strong: { color: theme.colors.link, fontFamily: theme.font.semibold },
  error: { fontSize: 13, color: theme.colors.danger, fontFamily: theme.font.medium },
  flex: { flex: 1 },
  dim: { opacity: 0.5 },
  switch: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  switchQ: { fontSize: 14, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  switchLink: { fontSize: 14, color: theme.colors.link, fontFamily: theme.font.semibold },
});
