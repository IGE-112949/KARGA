import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type LatLng = { latitude: number; longitude: number };
export const LISBON: LatLng = { latitude: 38.7223, longitude: -9.1393 };

export class LocationPermissionError extends Error {}

// Morada → coordenadas com o geocodificador do telemóvel (Google no Android, Apple no iOS). null se não encontrar.
// No Android o geocodificador exige a permissão de localização: sem ela lança LocationPermissionError.
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  if (Platform.OS === 'android') {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new LocationPermissionError('Sem acesso à localização');
  }
  try {
    const [r] = await Location.geocodeAsync(address);
    return r ? { latitude: r.latitude, longitude: r.longitude } : null;
  } catch {
    return null;
  }
}

// Localização atual + morada aproximada (geocodificação inversa).
export async function currentPlace(): Promise<LatLng & { address: string | null }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new LocationPermissionError('Sem acesso à localização');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const point = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  let address: string | null = null;
  try {
    const [a] = await Location.reverseGeocodeAsync(point);
    if (a) address = [[a.street, a.streetNumber].filter(Boolean).join(', '), a.city ?? a.subregion].filter(Boolean).join(', ') || null;
  } catch {
    address = null;
  }
  return { ...point, address };
}
