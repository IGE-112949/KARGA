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
const mockPickPhoto = jest.fn();
jest.mock('@/lib/avatar', () => ({ pickSpacePhoto: (src: string) => mockPickPhoto(src) }));
jest.mock('@/spaces/form', () => ({ photoFormData: async () => 'FORM' }));
jest.mock('@/ui/MapPicker', () => ({ MapPicker: () => null }));
jest.mock('@/lib/location', () => ({ geocodeAddress: jest.fn(), currentPlace: jest.fn(), LocationPermissionError: class extends Error {} }));

import Manage from '@/app/(app)/spaces/[id]/index';
import { dayLabel } from '@/ui/RangeCalendar';
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

  it('o interruptor muda logo, sem voltar atrás enquanto o pedido decorre', async () => {
    let resolve!: (v: unknown) => void;
    mockApi.patch.mockReturnValue(new Promise((r) => { resolve = r; }));
    await render(<Manage />);
    const sw = await screen.findByRole('switch', { name: 'Visível no mapa' });
    await fireEvent(sw, 'valueChange', false);
    expect(screen.getByRole('switch', { name: 'Visível no mapa' }).props.value).toBe(false);
    resolve({ ...space, status: 'inactive' });
  });

  it('se o pedido do interruptor falhar, volta ao estado anterior e mostra o erro', async () => {
    mockApi.patch.mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'Sem ligação à internet ou servidor indisponível.'));
    await render(<Manage />);
    await fireEvent(await screen.findByRole('switch', { name: 'Visível no mapa' }), 'valueChange', false);
    expect(await screen.findByText('Sem ligação à internet ou servidor indisponível.')).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Visível no mapa' }).props.value).toBe(true);
  });

  it('adicionar fotografia deixa escolher entre câmara e galeria', async () => {
    mockPickPhoto.mockResolvedValue({ uri: 'file:///c.jpg' });
    mockApi.upload.mockResolvedValue(space);
    await render(<Manage />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Adicionar fotografia' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Tirar fotografia' }));
    expect(mockPickPhoto).toHaveBeenCalledWith('camera');
    expect(mockApi.upload).toHaveBeenCalledWith('/me/spaces/s1/photos', 'FORM', 'POST');
  });

  it('se a câmara/galeria falhar mostra um aviso', async () => {
    mockPickPhoto.mockRejectedValue(new Error('x'));
    await render(<Manage />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Adicionar fotografia' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Escolher da galeria' }));
    expect(await screen.findByText('Não foi possível abrir a galeria. Tenta novamente.')).toBeTruthy();
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

  it('bloquear datas: escolhe o intervalo no calendário (dias inteiros, fim inclusive)', async () => {
    mockApi.post.mockResolvedValue([]);
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 40);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    await render(<Manage />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Bloquear datas' }));
    for (const d of [start, end]) {
      for (let i = 0; i < 4 && !screen.queryByRole('button', { name: dayLabel(d) }); i++) {
        await fireEvent.press(screen.getByRole('button', { name: 'Mês seguinte' }));
      }
      await fireEvent.press(screen.getByRole('button', { name: dayLabel(d) }));
    }
    await fireEvent.changeText(screen.getByLabelText('Motivo (opcional)'), 'Férias');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar bloqueio' }));
    expect(mockApi.post).toHaveBeenCalledWith('/me/spaces/s1/blocks', {
      startsAt: start.toISOString(),
      endsAt: new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1).toISOString(),
      reason: 'Férias',
    });
  });

  it('se gravar o bloqueio falhar, o formulário fica aberto com o erro e as datas escolhidas', async () => {
    mockApi.post.mockRejectedValue(new ApiError(409, 'BLOCK_OVERLAP', 'Já tens um bloqueio nessas datas.'));
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 40);
    await render(<Manage />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Bloquear datas' }));
    for (let i = 0; i < 4 && !screen.queryByRole('button', { name: dayLabel(start) }); i++) {
      await fireEvent.press(screen.getByRole('button', { name: 'Mês seguinte' }));
    }
    await fireEvent.press(screen.getByRole('button', { name: dayLabel(start) }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar bloqueio' }));
    expect(await screen.findAllByText('Já tens um bloqueio nessas datas.')).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Guardar bloqueio' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar bloqueio' }));
    expect(mockApi.post).toHaveBeenCalledTimes(2);
  });

  it('dias passados não se podem escolher; sem intervalo não guarda', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await render(<Manage />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Bloquear datas' }));
    if (yesterday.getMonth() === new Date().getMonth()) {
      expect(screen.getByRole('button', { name: dayLabel(yesterday) }).props.accessibilityState.disabled).toBe(true);
    }
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar bloqueio' }));
    expect(mockApi.post).not.toHaveBeenCalled();
    expect(screen.getByText('Escolhe o primeiro e o último dia no calendário')).toBeTruthy();
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
    await fireEvent.press(await screen.findByRole('button', { name: 'Sábado' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(mockApi.put).toHaveBeenCalledWith('/me/spaces/s1/availability', [
      { weekday: 0, startTime: '19:00', endTime: '08:00' },
      { weekday: 5, startTime: '19:00', endTime: '08:00' },
    ]);
  });
});
