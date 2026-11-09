const FALLBACK = 'Não foi possível concluir. Tenta novamente.';

// Mensagens da Supabase Auth em português.
export function authErrorMessage(err: { message?: string; code?: string } | null): string {
  if (!err) return FALLBACK;
  const code = err.code ?? '';
  const msg = (err.message ?? '').toLowerCase();
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'Email ou password incorretos.';
  if (code === 'user_already_exists' || code === 'email_exists' || msg.includes('already registered')) return 'Já existe uma conta com este email.';
  if (code === 'weak_password' || msg.includes('password should')) return 'A password é demasiado fraca (mínimo 8 caracteres, com letras e números).';
  if (code === 'email_address_invalid' || msg.includes('invalid email')) return 'Email inválido.';
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || msg.includes('rate limit')) return 'Demasiadas tentativas. Espera um pouco e tenta novamente.';
  return FALLBACK;
}
