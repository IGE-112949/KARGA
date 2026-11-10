import { render, fireEvent, screen } from '@testing-library/react-native';

const mockApi = { get: jest.fn(), put: jest.fn(), del: jest.fn() };
const mockPush = jest.fn();
jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return { useRouter: () => ({ push: mockPush, back: jest.fn(), canGoBack: () => true }), useFocusEffect: (cb: () => void) => useEffect(cb, []) };
});
jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ api: mockApi }) }));

import Favorites from '@/app/(app)/profile/favorites';

const fav = { id: 's1', title: 'Garagem Jardim', area: 'Odivelas', latitude: 1, longitude: 1, pricePerHour: 0.3, energyPriceKwh: null, powerKw: 7.4, plugType: 'type2', spaceType: 'covered', coverUrl: null, isFavorite: true, status: 'active' };

beforeEach(() => jest.clearAllMocks());

describe('Os meus favoritos', () => {
  it('lista, abre o detalhe e remove', async () => {
    mockApi.get.mockResolvedValue([fav, { ...fav, id: 's2', title: 'Box Fechada', status: 'inactive' }]);
    mockApi.del.mockResolvedValue(undefined);
    await render(<Favorites />);
    expect(await screen.findByText('Garagem Jardim')).toBeTruthy();
    expect(screen.getByText('Indisponível de momento')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Ver detalhes de Garagem Jardim' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/home/space/[id]', params: { id: 's1' } });
    await fireEvent.press(screen.getAllByRole('button', { name: 'Remover dos favoritos' })[0]);
    expect(mockApi.del).toHaveBeenCalledWith('/me/favorites/s1');
    expect(screen.queryByText('Garagem Jardim')).toBeNull();
  });

  it('estado vazio', async () => {
    mockApi.get.mockResolvedValue([]);
    await render(<Favorites />);
    expect(await screen.findByText('Ainda não tens favoritos')).toBeTruthy();
  });
});
