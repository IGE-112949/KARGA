import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type LatLng = { latitude: number; longitude: number };
export const LISBON: LatLng = { latitude: 38.7223, longitude: -9.1393 };

export class LocationPermissionError extends Error {}

// Morada → coordenadas com o geocodificador do telemóvel (Google no Android, Apple no iOS). null se não encontrar.
// No Android o geocodificador exige a permissão de localização: sem ela lança LocationPermissionError.
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  await ensureAndroidPermission();
  try {
    const [r] = await Location.geocodeAsync(address);
    return r ? { latitude: r.latitude, longitude: r.longitude } : null;
  } catch {
    return null;
  }
}

async function ensureAndroidPermission() {
  if (Platform.OS !== 'android') return;
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new LocationPermissionError('Sem acesso à localização');
}

export type Place = { address: string | null; area: string | null };

function toPlace(a: Location.LocationGeocodedAddress): Place {
  const address = [[a.street, a.streetNumber].filter(Boolean).join(', '), a.city ?? a.subregion].filter(Boolean).join(', ') || null;
  // Zona mostrada aos condutores antes de reservarem (freguesia/localidade).
  const area = a.district ?? a.city ?? a.subregion ?? null;
  return { address, area };
}

// Coordenadas → morada e zona aproximadas (null se não houver). Usado quando o pin é movido no mapa.
export async function addressAt(point: LatLng): Promise<Place | null> {
  await ensureAndroidPermission();
  try {
    const [a] = await Location.reverseGeocodeAsync(point);
    return a ? toPlace(a) : null;
  } catch {
    return null;
  }
}

// Localização atual + morada aproximada (geocodificação inversa).
export async function currentPlace(): Promise<LatLng & Place> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new LocationPermissionError('Sem acesso à localização');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const point = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  const place = await addressAt(point).catch(() => null);
  return { ...point, address: place?.address ?? null, area: place?.area ?? null };
}
