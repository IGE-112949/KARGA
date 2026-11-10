import { render, fireEvent, screen } from '@testing-library/react-native';

const mockMounts: string[] = [];
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View, Pressable } = require('react-native');
  const MapView = React.forwardRef(({ children, onPress }: { children: React.ReactNode; onPress?: () => void }, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({ animateToRegion: jest.fn(), getMapBoundaries: async () => ({ southWest: { latitude: 0, longitude: 0 }, northEast: { latitude: 1, longitude: 1 } }) }));
    return <Pressable accessibilityLabel="mapa" onPress={onPress}><View>{children}</View></Pressable>;
  });
  const Marker = ({ children, identifier, onPress }: { children: React.ReactNode; identifier: string; onPress: (e: unknown) => void }) => {
    React.useEffect(() => { mockMounts.push(identifier); }, []);
    return <Pressable accessibilityRole="button" accessibilityLabel={`marcador ${identifier}`} onPress={() => onPress({ stopPropagation() {} })}>{children}</Pressable>;
  };
  return { __esModule: true, default: MapView, Marker, Circle: () => null };
});

import { SpacesMap } from '@/search/SpacesMap';
import type { SearchResult } from '@/search/types';

const r = (id: string, price: number): SearchResult => ({ id, title: id, area: 'Odivelas', latitude: 38.79, longitude: -9.18, pricePerHour: price, energyPriceKwh: null, powerKw: 7.4, plugType: 'type2', spaceType: 'covered', coverUrl: null, isFavorite: false } as SearchResult);

describe('SpacesMap (mapa real, com react-native-maps simulado)', () => {
  it('mostra o preço de cada lugar e escolhe o lugar tocado', async () => {
    const onSelect = jest.fn();
    await render(<SpacesMap results={[r('a', 0.3), r('b', 0.45)]} selectedId={null} onSelect={onSelect} onRegion={jest.fn()} center={null} initial={{ latitude: 38.7, longitude: -9.1 }} />);
    expect(screen.getByText('0,30 €')).toBeTruthy();
    expect(screen.getByText('0,45 €')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'marcador b' }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('ao selecionar, o marcador é redesenhado (no Android a cor só muda assim)', async () => {
    mockMounts.length = 0;
    const props = { results: [r('a', 0.3)], onSelect: jest.fn(), onRegion: jest.fn(), center: null, initial: { latitude: 38.7, longitude: -9.1 } };
    const v = await render(<SpacesMap {...props} selectedId={null} />);
    await v.rerender(<SpacesMap {...props} selectedId="a" />);
    expect(mockMounts.filter((x) => x === 'a')).toHaveLength(2);
  });
});
