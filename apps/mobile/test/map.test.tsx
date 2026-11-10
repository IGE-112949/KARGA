import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';

const mockApi = { get: jest.fn(), put: jest.fn(), del: jest.fn() };
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ api: mockApi }) }));
jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: async () => ({ status: 'denied' }), Accuracy: {} }));
jest.mock('@/lib/location', () => ({ LISBON: { latitude: 38.7, longitude: -9.1 }, geocodeAddress: jest.fn() }));
jest.mock('@/search/SpacesMap', () => ({
  SpacesMap: ({ results, onSelect, onRegion }: { results: { id: string; title: string }[]; onSelect: (id: string) => void; onRegion: (b: unknown) => void }) => {
    const { useEffect } = require('react');
    const { Pressable, Text, View } = require('react-native');
    useEffect(() => {
      // várias mudanças seguidas (como num arrasto) → só uma pesquisa
      onRegion({ minLng: -9.3, minLat: 38.7, maxLng: -9.1, maxLat: 38.9 });
      onRegion({ minLng: -9.31, minLat: 38.7, maxLng: -9.11, maxLat: 38.9 });
      onRegion({ minLng: -9.32, minLat: 38.7, maxLng: -9.12, maxLat: 38.9 });
    }, []);
    return <View>{results.map((r) => <Pressable key={r.id} accessibilityRole="button" onPress={() => onSelect(r.id)}><Text>{`pin ${r.title}`}</Text></Pressable>)}</View>;
  },
}));

import { SearchProvider } from '@/search/SearchContext';
import { MapScreen } from '@/search/MapScreen';

const result = { id: 's1', title: 'Garagem Jardim', area: 'Odivelas', latitude: 38.79, longitude: -9.18, pricePerHour: 0.3, energyPriceKwh: 0.16, powerKw: 7.4, plugType: 'type2', spaceType: 'closed_garage', coverUrl: null, isFavorite: false };
const show = () => render(<SearchProvider><MapScreen /></SearchProvider>);

beforeEach(() => {
  jest.clearAllMocks();
  mockApi.get.mockResolvedValue([result]);
  mockApi.put.mockResolvedValue(undefined);
});

describe('Mapa do condutor', () => {
  it('pesquisa uma vez depois de o mapa parar, com a janela por omissão', async () => {
    await show();
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledTimes(1), { timeout: 2000 });
    const url = mockApi.get.mock.calls[0][0] as string;
    expect(url).toMatch(/^\/spaces\/search\?/);
    expect(url).toContain('bbox=-9.32%2C38.7%2C-9.12%2C38.9');
    expect(url).toContain('hours=2');
  });

  it('tocar num lugar mostra o cartão e abre o detalhe', async () => {
    await show();
    await fireEvent.press(await screen.findByText('pin Garagem Jardim', {}, { timeout: 2000 }));
    expect(screen.getByText('Garagem Jardim')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Ver detalhes de Garagem Jardim' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/home/space/[id]', params: { id: 's1' } });
  });

  it('"Rápido" volta a pesquisar com 7,4 kW ou mais', async () => {
    await show();
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledTimes(1), { timeout: 2000 });
    await fireEvent.press(screen.getByRole('button', { name: 'Rápido' }));
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledTimes(2), { timeout: 2000 });
    expect(mockApi.get.mock.calls[1][0]).toContain('minKw=7.4');
  });

  it('favorito no cartão', async () => {
    await show();
    await fireEvent.press(await screen.findByText('pin Garagem Jardim', {}, { timeout: 2000 }));
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar aos favoritos' }));
    expect(mockApi.put).toHaveBeenCalledWith('/me/favorites/s1', {});
    expect(screen.getByRole('button', { name: 'Remover dos favoritos' })).toBeTruthy();
  });

  it('sem resultados mostra a mensagem do mockup', async () => {
    mockApi.get.mockResolvedValue([]);
    await show();
    expect(await screen.findByText('Nenhum lugar corresponde a estes filtros.', {}, { timeout: 2000 })).toBeTruthy();
  });
});
