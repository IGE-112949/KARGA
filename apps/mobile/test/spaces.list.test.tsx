import { render, screen } from '@testing-library/react-native';

const mockApi = { get: jest.fn() };
jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return { useRouter: () => ({ push: jest.fn() }), useFocusEffect: (cb: () => void) => useEffect(cb, []) };
});
jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ api: mockApi }) }));

import SpacesList from '@/app/(app)/spaces/index';

const summary = {
  id: 's1', title: 'Garagem do Tiago', address: 'Rua Ferreira Borges, 40', spotDetails: null, latitude: 38.7, longitude: -9.1,
  spaceType: 'closed_garage', plugType: 'type2', powerKw: 7.4, pricePerHour: 0.3, energyPriceKwh: 0.15, status: 'active',
  coverUrl: 'https://x/c.jpg', createdAt: '2026-11-09T10:00:00Z',
  availability: [0, 1, 2, 3, 4].map((weekday) => ({ weekday, startTime: '19:00', endTime: '08:00' })),
};

describe('Os meus espaços', () => {
  it('mostra os cartões com preço, chips e horário', async () => {
    mockApi.get.mockResolvedValue([summary]);
    await render(<SpacesList />);
    expect(await screen.findByText('Garagem do Tiago')).toBeTruthy();
    expect(screen.getByText('0,30 €/h')).toBeTruthy();
    expect(screen.getByText('7,4 kW')).toBeTruthy();
    expect(screen.getByText('Seg–Sex 19:00–08:00')).toBeTruthy();
    expect(screen.getByText('Visível')).toBeTruthy();
  });

  it('sem espaços mostra o estado vazio', async () => {
    mockApi.get.mockResolvedValue([]);
    await render(<SpacesList />);
    expect(await screen.findByRole('button', { name: 'Adicionar o primeiro espaço' })).toBeTruthy();
  });
});
