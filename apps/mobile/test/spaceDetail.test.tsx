import { render, fireEvent, screen } from '@testing-library/react-native';
import { Share } from 'react-native';
import { ApiError } from '@/lib/api';

const mockApi = { get: jest.fn(), put: jest.fn(), del: jest.fn() };
const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, canGoBack: () => true, replace: jest.fn() }), useLocalSearchParams: () => ({ id: 's1' }) }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `karga://${p.replace(/^\//, '')}` }));
jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ api: mockApi }) }));

import { SearchProvider } from '@/search/SearchContext';
import SpaceDetail from '@/app/(app)/home/space/[id]';

const detail = {
  id: 's1', title: 'Garagem Jardim', area: 'Odivelas', latitude: 38.79, longitude: -9.18, pricePerHour: 0.3, energyPriceKwh: 0.15,
  powerKw: 7.4, plugType: 'type2', spaceType: 'closed_garage', coverUrl: 'https://x/1.png', isFavorite: false, isOwn: false,
  photos: [{ id: 'p1', url: 'https://x/1.png' }, { id: 'p2', url: 'https://x/2.png' }],
  host: { firstName: 'Ana', initial: 'R', avatarUrl: null }, available: true,
  cost: { hours: 2, place: 0.6, energyKwh: 14.8, energy: 2.22, serviceFeePercent: 10, serviceFee: 0.28, total: 3.1 },
};
const show = () => render(<SearchProvider><SpaceDetail /></SearchProvider>);

beforeEach(() => {
  jest.clearAllMocks();
  mockApi.get.mockResolvedValue(detail);
  mockApi.put.mockResolvedValue(undefined);
});

describe('Detalhe do lugar', () => {
  it('mostra zona, proprietário, custos e Reservar desativado', async () => {
    await show();
    expect(await screen.findByText('Garagem Jardim')).toBeTruthy();
    expect(mockApi.get.mock.calls[0][0]).toMatch(/^\/spaces\/s1\?date=\d{4}-\d{2}-\d{2}&start=\d{2}%3A\d{2}&hours=2$/);
    expect(screen.getAllByText('Odivelas').length).toBeGreaterThan(0);
    expect(screen.getByText('Ana R.')).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();
    expect(screen.getByText('Disponível')).toBeTruthy();
    expect(screen.getByText('0,28 €')).toBeTruthy();
    expect(screen.getAllByText('3,10 €').length).toBeGreaterThan(0);
    const reserve = screen.getByRole('button', { name: /Reservar/ });
    expect(reserve.props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByText(/Rua/)).toBeNull();
  });

  it('ao mudar a janela não mostra o custo antigo enquanto recalcula; erro no recálculo aparece', async () => {
    await show();
    expect(await screen.findByText('Disponível')).toBeTruthy();
    let reject!: (e: unknown) => void;
    mockApi.get.mockReturnValueOnce(new Promise((_, r) => { reject = r; }));
    await fireEvent.press(screen.getByRole('button', { name: 'Duração: mais' }));
    expect(screen.getByText('A recalcular…')).toBeTruthy();
    expect(screen.queryByText('Disponível')).toBeNull();
    expect(screen.queryAllByText('3,10 €')).toHaveLength(0);
    reject(new ApiError(0, 'NETWORK_ERROR', 'Sem ligação à internet ou servidor indisponível.'));
    expect(await screen.findByText('Não foi possível atualizar: Sem ligação à internet ou servidor indisponível.')).toBeTruthy();
    expect(screen.queryByText('Disponível')).toBeNull();
  });

  it('indisponível na janela', async () => {
    mockApi.get.mockResolvedValue({ ...detail, available: false });
    await show();
    expect(await screen.findByText('Indisponível nesta janela')).toBeTruthy();
  });

  it('favorito e partilhar', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Adicionar aos favoritos' }));
    expect(mockApi.put).toHaveBeenCalledWith('/me/favorites/s1', {});
    await fireEvent.press(screen.getByRole('button', { name: 'Partilhar' }));
    expect(share.mock.calls[0][0].message).toBe('Garagem Jardim · 0,30 €/h · Odivelas — vê na Karga: karga://home/space/s1');
  });

  it('lugar que já não existe', async () => {
    mockApi.get.mockRejectedValue(new ApiError(404, 'SPACE_NOT_FOUND', 'Espaço não encontrado'));
    await show();
    expect(await screen.findByText('Este lugar já não está disponível.')).toBeTruthy();
  });
});
