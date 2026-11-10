import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';
import { MAP_STYLE } from '@/ui/mapStyle';
import { formatEuro } from '@/lib/spaces';
import type { LatLng } from '@/lib/location';
import { theme } from '@/theme';
import type { Bbox } from './search';
import type { SearchResult } from './types';

export const APPROX_RADIUS_M = 150;
export const regionToBbox = (r: Region): Bbox => ({
  minLng: r.longitude - r.longitudeDelta / 2, maxLng: r.longitude + r.longitudeDelta / 2,
  minLat: r.latitude - r.latitudeDelta / 2, maxLat: r.latitude + r.latitudeDelta / 2,
});

// Mapa do condutor: cada lugar é uma zona (círculo ~150 m) com a etiqueta do preço.
export function SpacesMap({ results, selectedId, onSelect, onRegion, center, initial }: {
  results: SearchResult[]; selectedId: string | null; onSelect: (id: string | null) => void;
  onRegion: (b: Bbox) => void; center: LatLng | null; initial: LatLng;
}) {
  const ref = useRef<MapView>(null);
  useEffect(() => {
    if (center) ref.current?.animateToRegion({ ...center, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 500);
  }, [center?.latitude, center?.longitude]);

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...initial, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
      customMapStyle={MAP_STYLE}
      showsUserLocation
      showsMyLocationButton={false}
      toolbarEnabled={false}
      showsPointsOfInterests={false}
      onMapReady={() => ref.current?.getMapBoundaries().then((b) => onRegion({ minLng: b.southWest.longitude, minLat: b.southWest.latitude, maxLng: b.northEast.longitude, maxLat: b.northEast.latitude })).catch(() => undefined)}
      onRegionChangeComplete={(r) => onRegion(regionToBbox(r))}
      onPress={() => onSelect(null)}
    >
      {results.map((s) => {
        const sel = s.id === selectedId;
        return (
          <View key={s.id}>
            <Circle center={s} radius={APPROX_RADIUS_M} fillColor={sel ? 'rgba(19,38,58,0.18)' : 'rgba(16,185,129,0.20)'} strokeColor={sel ? theme.colors.navy : theme.colors.accent} strokeWidth={1.5} />
            <Marker coordinate={s} onPress={(e) => { e.stopPropagation(); onSelect(s.id); }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false} identifier={s.id}>
              <View style={[styles.bubble, sel && styles.bubbleSel]}>
                <Text style={[styles.price, sel && styles.priceSel]}>{formatEuro(s.pricePerHour)}</Text>
              </View>
            </Marker>
          </View>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  bubble: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: theme.colors.white, borderWidth: 1.5, borderColor: theme.colors.accent, ...theme.shadow.card },
  bubbleSel: { backgroundColor: theme.colors.navy, borderColor: theme.colors.navy },
  price: { fontSize: 13, fontFamily: theme.font.bold, color: theme.colors.text },
  priceSel: { color: theme.colors.white },
});
