import { render, fireEvent, screen } from '@testing-library/react-native';
import { ApiError } from '@/lib/api';

const mockSignUp = jest.fn();
const mockReplace = jest.fn();
const mockApi = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), del: jest.fn(), upload: jest.fn() };
const mockRefresh = jest.fn();
const mockPick = jest.fn();
let mockMetadata: Record<string, unknown> = { full_name: 'Ana Silva', phone: '+351912345678' };

jest.mock('@/lib/supabase', () => ({ supabase: { auth: { signUp: (...a: unknown[]) => mockSignUp(...a) } } }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), replace: mockReplace, push: jest.fn(), canGoBack: () => true }) }));
jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({ api: mockApi, refreshProfile: mockRefresh, session: { user: { user_metadata: mockMetadata } }, signOut: jest.fn() }),
}));
jest.mock('@/lib/avatar', () => ({ pickAvatar: () => mockPick(), avatarFormData: async (uri: string) => ({ uri }) }));

import Step1 from '@/app/(auth)/register/index';
import Step2 from '@/app/(auth)/register/role';
import Step3 from '@/app/(auth)/register/vehicle';

beforeEach(() => {
  jest.clearAllMocks();
  mockMetadata = { full_name: 'Ana Silva', phone: '+351912345678' };
  mockRefresh.mockResolvedValue({});
});

async function fillStep1() {
  await fireEvent.changeText(screen.getByLabelText('Nome completo'), '  Ana Silva ');
  await fireEvent.changeText(screen.getByLabelText('Email'), ' Ana@Mail.pt');
  await fireEvent.changeText(screen.getByLabelText('Telemóvel'), '+351 912 345 678');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'segredo123');
}

describe('Registo · passo 1', () => {
  it('sem aceitar os termos não chama signUp', async () => {
    await render(<Step1 />);
    await fillStep1();
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(screen.getByText('Tens de aceitar os Termos e a Política de Privacidade')).toBeTruthy();
  });

  it('com termos aceites chama signUp com metadata normalizada', async () => {
    mockSignUp.mockResolvedValue({ data: { session: { access_token: 't' } }, error: null });
    await render(<Step1 />);
    await fillStep1();
    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'ana@mail.pt', password: 'segredo123', options: { data: { full_name: 'Ana Silva', phone: '+351912345678' } },
    });
    expect(mockReplace).toHaveBeenCalledWith('/register/role');
  });

  it('email já registado mostra mensagem em português', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: { code: 'user_already_exists', message: 'User already registered' } });
    await render(<Step1 />);
    await fillStep1();
    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('Já existe uma conta com este email.')).toBeTruthy();
  });
});

describe('Registo · passo 2', () => {
  it('"Ambos" cria o perfil com os dois papéis e o nome do metadata, e segue para o veículo', async () => {
    mockApi.post.mockResolvedValue({});
    await render(<Step2 />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Ambos' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(mockApi.post).toHaveBeenCalledWith('/me', { fullName: 'Ana Silva', phone: '+351912345678', isDriver: true, isHost: true, acceptTerms: true });
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/register/vehicle');
  });

  it('"Proprietário" vai direto para o perfil', async () => {
    mockApi.post.mockResolvedValue({});
    await render(<Step2 />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Proprietário' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(mockApi.post).toHaveBeenCalledWith('/me', expect.objectContaining({ isDriver: false, isHost: true }));
    expect(mockReplace).toHaveBeenCalledWith('/profile');
  });

  it('com foto escolhida faz POST /me e depois PUT /me/avatar', async () => {
    const calls: string[] = [];
    mockApi.post.mockImplementation(async (p: string) => { calls.push(`POST ${p}`); return {}; });
    mockApi.upload.mockImplementation(async (p: string) => { calls.push(`PUT ${p}`); return {}; });
    mockPick.mockResolvedValue({ uri: 'file:///foto.jpg', mimeType: 'image/jpeg' });
    await render(<Step2 />);
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar foto' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(calls).toEqual(['POST /me', 'PUT /me/avatar']);
  });

  it('falha da foto não bloqueia o registo', async () => {
    mockApi.post.mockResolvedValue({});
    mockApi.upload.mockRejectedValue(new ApiError(400, 'INVALID_IMAGE', 'Imagem inválida'));
    mockPick.mockResolvedValue({ uri: 'file:///foto.jpg', mimeType: 'image/jpeg' });
    await render(<Step2 />);
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar foto' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    expect(mockReplace).toHaveBeenCalledWith('/register/vehicle');
  });
});

describe('Registo · passo 3', () => {
  async function fillVehicle() {
    await fireEvent.changeText(screen.getByLabelText('Marca / Modelo'), 'Renault Zoe');
    await fireEvent.changeText(screen.getByLabelText('Matrícula'), 'aa 12 bb');
    await fireEvent.press(screen.getByRole('button', { name: 'Tipo 2' }));
  }

  it('cria o veículo e vai para o perfil', async () => {
    mockApi.post.mockResolvedValue({});
    await render(<Step3 />);
    await fillVehicle();
    await fireEvent.press(screen.getByRole('button', { name: 'Começar a usar a Karga' }));
    expect(mockApi.post).toHaveBeenCalledWith('/me/vehicles', { makeModel: 'Renault Zoe', plate: 'AA-12-BB', plugType: 'type2' });
    expect(mockReplace).toHaveBeenCalledWith('/profile');
  });

  it('PLATE_TAKEN aparece no campo da matrícula', async () => {
    mockApi.post.mockRejectedValue(new ApiError(409, 'PLATE_TAKEN', 'Esta matrícula já está registada'));
    await render(<Step3 />);
    await fillVehicle();
    await fireEvent.press(screen.getByRole('button', { name: 'Começar a usar a Karga' }));
    expect(await screen.findByText('Esta matrícula já está registada')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('"Saltar por agora" não chama a API', async () => {
    await render(<Step3 />);
    await fireEvent.press(screen.getByRole('button', { name: 'Saltar por agora' }));
    expect(mockApi.post).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/profile');
  });
});
