import { render, fireEvent, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { ApiError } from '@/lib/api';

const mockApi = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), del: jest.fn(), upload: jest.fn(), put: jest.fn() };
const mockReplace = jest.fn();
const mockPick = jest.fn();
const mockBuild = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, back: jest.fn(), push: jest.fn(), canGoBack: () => true }) }));
jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ api: mockApi }) }));
jest.mock('@/lib/location', () => ({
  LISBON: { latitude: 38.7, longitude: -9.1 },
  LocationPermissionError: class extends Error {},
  geocodeAddress: jest.fn(async () => ({ latitude: 38.71, longitude: -9.16 })),
  currentPlace: jest.fn(),
}));
jest.mock('@/ui/MapPicker', () => ({
  MapPicker: ({ onChange }: { onChange: (p: { latitude: number; longitude: number }) => void }) => {
    const { Pressable: P, Text: T } = require('react-native');
    return <P accessibilityRole="button" onPress={() => onChange({ latitude: 38.72, longitude: -9.15 })}><T>Marcar pin</T></P>;
  },
}));
jest.mock('@/lib/avatar', () => ({ pickSpacePhoto: () => mockPick() }));
jest.mock('@/spaces/form', () => ({ spaceFormData: async (data: unknown, photos: unknown) => { mockBuild(data, photos); return 'FORM'; } }));

import NewSpace from '@/app/(app)/spaces/new';

void Pressable; void Text;
beforeEach(() => {
  jest.clearAllMocks();
  mockPick.mockResolvedValue({ uri: 'file:///g.jpg', mimeType: 'image/jpeg' });
});

const next = () => fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

async function step1() {
  await fireEvent.changeText(screen.getByLabelText('Nome do espaço'), 'Garagem do Tiago');
  await fireEvent.changeText(screen.getByLabelText('Morada'), 'Rua Ferreira Borges, 40, Lisboa');
  await fireEvent.press(screen.getByRole('button', { name: 'Marcar pin' }));
  await next();
}
async function step2(plug: 'Schuko' | 'Tipo 2' = 'Tipo 2') {
  await fireEvent.press(screen.getByRole('button', { name: /Adicionar fotografia/ }));
  await fireEvent.press(screen.getByRole('button', { name: new RegExp(`^${plug}`) }));
  if (plug === 'Tipo 2') await fireEvent.press(screen.getByRole('button', { name: '7,4 kW' }));
  await next();
}
async function step3() {
  await fireEvent.changeText(screen.getByLabelText('Lugar (€/hora)'), '0,30');
  await fireEvent(screen.getByRole('switch', { name: 'Segunda' }), 'valueChange', true);
  await next();
}

describe('Novo espaço', () => {
  it('erro de validação da API ao publicar mostra a mensagem do campo', async () => {
    mockApi.upload.mockRejectedValue(new ApiError(400, 'VALIDATION_ERROR', 'Dados inválidos', [{ field: 'title', message: 'O nome é demasiado longo' }]));
    await render(<NewSpace />);
    await step1();
    await step2();
    await step3();
    await next();
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar espaço' }));
    expect(await screen.findByText('Não foi possível publicar: O nome é demasiado longo')).toBeTruthy();
  });

  it('sem permissão de localização, a morada mostra o aviso certo e volta a tentar', async () => {
    const loc = jest.requireMock('@/lib/location');
    loc.geocodeAddress.mockRejectedValueOnce(new loc.LocationPermissionError('x'));
    await render(<NewSpace />);
    const addr = screen.getByLabelText('Morada');
    await fireEvent.changeText(addr, 'Rua Ferreira Borges, 40');
    await fireEvent(addr, 'blur');
    expect(await screen.findByText('Sem acesso à localização: marca o lugar tocando no mapa.')).toBeTruthy();
    await fireEvent(addr, 'blur');
    expect(loc.geocodeAddress).toHaveBeenCalledTimes(2);
  });

  it('passo 1 não avança sem marcar o lugar', async () => {
    await render(<NewSpace />);
    await fireEvent.changeText(screen.getByLabelText('Nome do espaço'), 'Garagem');
    await fireEvent.changeText(screen.getByLabelText('Morada'), 'Rua X, 1');
    await next();
    expect(screen.getByText('Marca o lugar no mapa')).toBeTruthy();
  });

  it('passo 2 exige pelo menos uma fotografia', async () => {
    await render(<NewSpace />);
    await step1();
    await next();
    expect(screen.getByText('Adiciona pelo menos uma fotografia.')).toBeTruthy();
  });

  it('"Aplicar a todos os dias" copia o horário da segunda', async () => {
    await render(<NewSpace />);
    await step1();
    await step2();
    await fireEvent(screen.getByRole('switch', { name: 'Segunda' }), 'valueChange', true);
    await fireEvent.press(screen.getByRole('button', { name: 'Aplicar a todos os dias' }));
    expect(screen.getByRole('switch', { name: 'Domingo' }).props.accessibilityState.checked).toBe(true);
  });

  it('publica com Schuko 13 A = 3 kW e vai para o ecrã de publicado', async () => {
    mockApi.upload.mockResolvedValue({ id: 's1' });
    await render(<NewSpace />);
    await step1();
    await fireEvent.press(screen.getByRole('button', { name: /Adicionar fotografia/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Schuko/ }));
    await fireEvent.press(screen.getByRole('button', { name: '13 A' }));
    await next();
    await step3();
    await next(); // tomada inteligente (em breve)
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar espaço' }));
    const [data, photos] = mockBuild.mock.calls[0];
    expect(data).toMatchObject({
      title: 'Garagem do Tiago', plugType: 'schuko', powerKw: 3, pricePerHour: 0.3, energyPriceKwh: null,
      latitude: 38.72, longitude: -9.15, availability: [{ weekday: 0, startTime: '19:00', endTime: '08:00' }],
    });
    expect(photos).toHaveLength(1);
    expect(mockApi.upload).toHaveBeenCalledWith('/me/spaces', 'FORM', 'POST');
    expect(mockReplace).toHaveBeenCalledWith({ pathname: '/spaces/published', params: { id: 's1' } });
  });

  it('erro ao publicar mantém os dados e mostra a mensagem', async () => {
    mockApi.upload.mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'Sem ligação'));
    await render(<NewSpace />);
    await step1();
    await step2();
    await step3();
    await next();
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar espaço' }));
    expect(await screen.findByText('Não foi possível publicar. Tenta novamente.')).toBeTruthy();
    expect(screen.getByText('Garagem do Tiago')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
