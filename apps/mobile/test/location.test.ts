import { Platform } from 'react-native';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  geocodeAsync: jest.fn(),
}));
const mockLoc = jest.requireMock('expo-location') as Record<string, jest.Mock>;

import { geocodeAddress, LocationPermissionError } from '@/lib/location';

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'android';
  mockLoc.getForegroundPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
});

describe('geocodeAddress', () => {
  it('no Android pede permissão antes de geocodificar', async () => {
    mockLoc.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockLoc.geocodeAsync.mockResolvedValue([{ latitude: 38.7, longitude: -9.1 }]);
    expect(await geocodeAddress('Rua X, 1')).toEqual({ latitude: 38.7, longitude: -9.1 });
    expect(mockLoc.requestForegroundPermissionsAsync).toHaveBeenCalled();
  });

  it('sem permissão no Android lança LocationPermissionError (não "morada não encontrada")', async () => {
    mockLoc.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    await expect(geocodeAddress('Rua X, 1')).rejects.toBeInstanceOf(LocationPermissionError);
    expect(mockLoc.geocodeAsync).not.toHaveBeenCalled();
  });

  it('morada desconhecida → null', async () => {
    mockLoc.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockLoc.geocodeAsync.mockResolvedValue([]);
    expect(await geocodeAddress('zzz')).toBeNull();
  });
});
