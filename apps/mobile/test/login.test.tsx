import { render, fireEvent, screen } from '@testing-library/react-native';

const mockSignIn = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: { auth: { signInWithPassword: (...a: unknown[]) => mockSignIn(...a) } } }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: () => true }) }));

import LoginScreen from '@/app/(auth)/login';

beforeEach(() => mockSignIn.mockReset());

describe('Login', () => {
  it('normaliza o email antes de entrar', async () => {
    mockSignIn.mockResolvedValue({ data: {}, error: null });
    await render(<LoginScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), '  Ana@Mail.PT ');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'segredo123');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'ana@mail.pt', password: 'segredo123' });
  });

  it('mostra o erro de credenciais em português', async () => {
    mockSignIn.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials', code: 'invalid_credentials' } });
    await render(<LoginScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'ana@mail.pt');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'errada123');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Email ou password incorretos.')).toBeTruthy();
  });

  it('depois de entrar com sucesso o botão fica a carregar até mudar de ecrã', async () => {
    mockSignIn.mockResolvedValue({ data: {}, error: null });
    await render(<LoginScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'ana@mail.pt');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'segredo123');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(mockSignIn).toHaveBeenCalled();
    expect(screen.getByTestId('button-loading')).toBeTruthy();
  });

  it('Google está desativado e mostra "Em breve"', async () => {
    await render(<LoginScreen />);
    const google = screen.getByRole('button', { name: /Continuar com Google/ });
    expect(google.props.accessibilityState?.disabled ?? google.props['aria-disabled']).toBe(true);
    expect(screen.getByText('Em breve')).toBeTruthy();
    expect(screen.queryByText(/Apple/)).toBeNull();
  });
});
