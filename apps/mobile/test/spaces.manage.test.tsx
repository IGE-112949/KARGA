import { render, fireEvent, screen } from '@testing-library/react-native';
import { ApiError } from '@/lib/api';

const mockApi = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), del: jest.fn(), upload: jest.fn(), put: jest.fn() };
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockPush = jest.fn();
let mockParams: Record<string, string> = { id: 's1' };

jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return {
    useRouter: () => ({ replace: mockReplace, back: mockBack, push: mockPush, canGoBack: () => true }),
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (cb: () => void) => useEffect(cb, []),
  };
});
jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ api: mockApi }) }));
jest.mock('@/lib/avatar', () => ({ pickSpacePhoto: jest.fn() }));
jest.mock('@/spaces/form', () => ({ photoFormData: async () => 'FORM' }));
jest.mock('@/ui/MapPicker', () => ({ MapPicker: () => null }));
jest.mock('@/lib/location', () => ({ geocodeAddress: jest.fn(), currentPlace: jest.fn(), LocationPermissionError: class extends Error {} }));

import Manage from '@/app/(app)/spaces/[id]/index';
import Edit from '@/app/(app)/spaces/[id]/edit';

const space = {
  id: 's1', title: 'Garagem do Tiago', address: 'Rua Ferreira Borges, 40', spotDetails: 'Piso -1', latitude: 38.7, longitude: -9.1,
  spaceType: 'closed_garage', plugType: 'type2', powerKw: 7.4, pricePerHour: 0.3, energyPriceKwh: 0.15, status: 'active',
  accessInstructions: null, accessCode: null, createdAt: '2026-11-09T10:00:00Z',
  photos: [{ id: 'p1', url: 'https://x/1.jpg', isCover: true }, { id: 'p2', url: 'https://x/2.jpg', isCover: false }],
  availability: [{ weekday: 0, startTime: '19:00', endTime: '08:00' }],
  blocks: [{ id: 'b1', startsAt: '2026-12-20T00:00:00Z', endsAt: '2026-12-27T00:00:00Z', reason: 'Férias' }],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id: 's1' };
  mockApi.get.mockResolvedValue(space);
  mockApi.patch.mockResolvedValue(space);
});

describe('Gerir espaço', () => {
  it('interruptor "Visível no mapa" envia o estado', async () => {
    await render(<Manage />);
    await fireEvent(await screen.findByRole('switch', { name: 'Visível no mapa' }), 'valueChange', false);
    expect(mockApi.patch).toHaveBeenCalledWith('/me/spaces/s1', { status: 'inactive' });
  });

  it('tornar uma foto capa', async () => {
    await render(<Manage />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Fotografia 2' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Tornar capa' }));
    expect(mockApi.patch).toHaveBeenCalledWith('/me/spaces/s1/photos/p2', { isCover: true });
  });

  it('remover a última foto mostra o erro da API', async () => {
    mockApi.del.mockRejectedValue(new ApiError(409, 'LAST_PHOTO', 'O espaço tem de ter pelo menos uma fotografia'));
    await render(<Manage />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Fotografia 1' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Remover fotografia' }));
    expect(await screen.findByText('O espaço tem de ter pelo menos uma fotografia')).toBeTruthy();
  });

  it('bloquear datas: dias inteiros, fim inclusive', async () => {
    mockApi.post.mockResolvedValue([]);
    await render(<Manage />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Bloquear datas' }));
    await fireEvent.changeText(screen.getByLabelText('Início'), '20/12/2026');
    await fireEvent.changeText(screen.getByLabelText('Fim'), '27/12/2026');
    await fireEvent.changeText(screen.getByLabelText('Motivo (opcional)'), 'Férias');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar bloqueio' }));
    expect(mockApi.post).toHaveBeenCalledWith('/me/spaces/s1/blocks', {
      startsAt: new Date(2026, 11, 20).toISOString(), endsAt: new Date(2026, 11, 28).toISOString(), reason: 'Férias',
    });
  });

  it('data inválida não envia', async () => {
    await render(<Manage />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Bloquear datas' }));
    await fireEvent.changeText(screen.getByLabelText('Início'), '31/02/2026');
    await fireEvent.changeText(screen.getByLabelText('Fim'), '27/12/2026');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar bloqueio' }));
    expect(mockApi.post).not.toHaveBeenCalled();
    expect(screen.getByText('Data inválida (DD/MM/AAAA)')).toBeTruthy();
  });

  it('remover bloqueio', async () => {
    mockApi.del.mockResolvedValue(undefined);
    await render(<Manage />);
    await fireEvent.press(await screen.findByRole('button', { name: /Remover bloqueio/ }));
    expect(mockApi.del).toHaveBeenCalledWith('/me/spaces/s1/blocks/b1');
  });

  it('eliminar pede confirmação e volta à lista', async () => {
    mockApi.del.mockResolvedValue(undefined);
    await render(<Manage />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Eliminar espaço' }));
    expect(mockApi.del).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar' }));
    expect(mockApi.del).toHaveBeenCalledWith('/me/spaces/s1');
    expect(mockReplace).toHaveBeenCalledWith('/spaces');
  });

  it('eliminar com reservas futuras mostra a mensagem', async () => {
    mockApi.del.mockRejectedValue(new ApiError(409, 'SPACE_HAS_BOOKINGS', 'Tens reservas futuras neste espaço. Cancela-as primeiro.'));
    await render(<Manage />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Eliminar espaço' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findByText('Tens reservas futuras neste espaço. Cancela-as primeiro.')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('Editar espaço', () => {
  it('preço: grava só o preço e volta', async () => {
    mockParams = { id: 's1', section: 'price' };
    await render(<Edit />);
    await fireEvent.changeText(await screen.findByLabelText('Lugar (€/hora)'), '0,50');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(mockApi.patch).toHaveBeenCalledWith('/me/spaces/s1', { pricePerHour: 0.5, energyPriceKwh: 0.15 });
    expect(mockBack).toHaveBeenCalled();
  });

  it('horário: substitui com PUT', async () => {
    mockParams = { id: 's1', section: 'schedule' };
    mockApi.put = jest.fn().mockResolvedValue(space);
    await render(<Edit />);
    await fireEvent(await screen.findByRole('switch', { name: 'Sábado' }), 'valueChange', true);
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(mockApi.put).toHaveBeenCalledWith('/me/spaces/s1/availability', [
      { weekday: 0, startTime: '19:00', endTime: '08:00' },
      { weekday: 5, startTime: '19:00', endTime: '08:00' },
    ]);
  });
});
