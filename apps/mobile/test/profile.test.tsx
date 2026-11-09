import { render, fireEvent, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile } from '@/lib/types';

const mockApi = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), del: jest.fn(), upload: jest.fn() };
const mockRefresh = jest.fn();
const mockSignOut = jest.fn();
const mockPush = jest.fn();
let mockProfile: Profile;

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }) }));
jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({ api: mockApi, profile: mockProfile, refreshProfile: mockRefresh, signOut: mockSignOut, session: { user: { email: 'ana@mail.pt' } } }),
}));
jest.mock('@/lib/avatar', () => ({ pickAvatar: jest.fn(), avatarFormData: jest.fn() }));

import { ModeProvider } from '@/profile/ModeContext';
import ProfileScreen from '@/app/(app)/profile/index';

const base: Profile = {
  id: 'u1', fullName: 'Ana Silva', phone: '+351912345678', avatarUrl: null, isDriver: true, isHost: false,
  termsAcceptedAt: '2026-11-09T10:00:00.000Z',
  vehicles: [
    { id: 'v1', makeModel: 'Renault Zoe', plate: 'AA-12-BB', plugType: 'type2', isDefault: false },
    { id: 'v2', makeModel: 'Tesla Model 3', plate: '12-AB-34', plugType: 'ccs', isDefault: true },
  ],
};

const show = () => render(<ModeProvider><ProfileScreen /></ModeProvider>);

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockProfile = base;
  mockRefresh.mockResolvedValue(base);
});

describe('Perfil', () => {
  it('mostra nome, email e "Modo Condutor"', async () => {
    await show();
    expect(screen.getAllByText('Ana Silva').length).toBeGreaterThan(0);
    expect(screen.getByText('ana@mail.pt')).toBeTruthy();
    expect(screen.getByLabelText('Telemóvel').props.value).toBe('912 345 678');
    expect(await screen.findByText('Modo Condutor')).toBeTruthy();
  });

  it('sem foto mostra as iniciais; com foto mostra a imagem', async () => {
    await show();
    expect(screen.getByText('AS')).toBeTruthy();
    expect(screen.queryByTestId('avatar-image')).toBeNull();
    mockProfile = { ...base, avatarUrl: 'https://x/avatars/u1/1.jpg' };
    await screen.rerender(<ModeProvider><ProfileScreen /></ModeProvider>);
    expect(screen.getByTestId('avatar-image')).toBeTruthy();
  });

  it('só condutor: "Ativar Modo Proprietário" pede confirmação antes do PATCH /me {isHost:true}', async () => {
    mockApi.patch.mockResolvedValue({});
    await show();
    await fireEvent.press(screen.getByRole('button', { name: /Ativar Modo Proprietário/ }));
    expect(mockApi.patch).not.toHaveBeenCalled();
    expect(screen.getByText('Ativar Modo Proprietário?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Ativar' }));
    expect(mockApi.patch).toHaveBeenCalledWith('/me', { isHost: true });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('com os dois modos ativos muda sem pedir confirmação', async () => {
    mockProfile = { ...base, isHost: true };
    await show();
    await fireEvent.press(screen.getByRole('button', { name: /Mudar para Modo Proprietário/ }));
    expect(screen.queryByText('Ativar Modo Proprietário?')).toBeNull();
    expect(await screen.findByText('Modo Proprietário')).toBeTruthy();
    expect(mockApi.patch).not.toHaveBeenCalled();
  });

  it('lista os veículos com "Predefinido" no certo', async () => {
    await show();
    const tesla = screen.getByRole('button', { name: /Tesla Model 3/ });
    const zoe = screen.getByRole('button', { name: /Renault Zoe/ });
    expect(tesla.props.accessibilityLabel).toMatch(/Predefinido/);
    expect(zoe.props.accessibilityLabel).not.toMatch(/Predefinido/);
  });

  it('"Apagar conta" só chama DELETE /me depois de confirmar', async () => {
    mockApi.del.mockResolvedValue(undefined);
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Apagar conta' }));
    expect(mockApi.del).not.toHaveBeenCalled();
    expect(screen.getByText('Esta ação apaga a tua conta e todos os teus dados. Não pode ser desfeita.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Apagar definitivamente' }));
    expect(mockApi.del).toHaveBeenCalledWith('/me');
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('"Terminar sessão" chama signOut', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Terminar sessão' }));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('guardar dados pessoais envia PATCH /me com o telemóvel sem espaços', async () => {
    mockApi.patch.mockResolvedValue({});
    await show();
    await fireEvent.changeText(screen.getByLabelText('Telemóvel'), '913 000 000');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar alterações' }));
    expect(mockApi.patch).toHaveBeenCalledWith('/me', { fullName: 'Ana Silva', phone: '+351913000000' });
  });
});
