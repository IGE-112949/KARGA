import { authErrorMessage } from '@/lib/authErrors';

describe('authErrorMessage', () => {
  it.each([
    [{ message: 'Invalid login credentials' }, 'Email ou password incorretos.'],
    [{ code: 'user_already_exists' }, 'Já existe uma conta com este email.'],
    [{ message: 'User already registered' }, 'Já existe uma conta com este email.'],
    [{ code: 'weak_password' }, 'A password é demasiado fraca (mínimo 8 caracteres, com letras e números).'],
    [{ code: 'email_address_invalid' }, 'Email inválido.'],
    [{ code: 'over_request_rate_limit' }, 'Demasiadas tentativas. Espera um pouco e tenta novamente.'],
    [{ message: 'algo estranho' }, 'Não foi possível concluir. Tenta novamente.'],
    [null, 'Não foi possível concluir. Tenta novamente.'],
  ])('%j → %s', (input, expected) => {
    expect(authErrorMessage(input)).toBe(expected);
  });
});
