import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Icon } from './Icon';
import { theme } from '@/theme';
import { LISBON, type LatLng } from '@/lib/location';
import { MAP_STYLE } from './mapStyle';

const DELTA = { latitudeDelta: 0.006, longitudeDelta: 0.006 };

// Mapa com pin arrastável (react-native-maps: Google Maps no Android, Apple Maps no iOS).
export function MapPicker({ value, onChange, height = 200 }: { value: LatLng | null; onChange: (p: LatLng) => void; height?: number }) {
  const ref = useRef<MapView>(null);
  const center = value ?? LISBON;

  useEffect(() => {
    if (value) ref.current?.animateToRegion({ ...value, ...DELTA } as Region, 400);
  }, [value?.latitude, value?.longitude]);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...center, ...(value ? DELTA : { latitudeDelta: 0.08, longitudeDelta: 0.08 }) }}
        customMapStyle={MAP_STYLE}
        onPress={(e) => onChange(e.nativeEvent.coordinate)}
        toolbarEnabled={false}
        showsPointsOfInterests={false}
      >
        {value ? (
          <Marker coordinate={value} draggable onDragEnd={(e) => onChange(e.nativeEvent.coordinate)} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.pin}><Icon name="bolt" size={18} color={theme.colors.white} filled strokeWidth={0} /></View>
          </Marker>
        ) : null}
      </MapView>
      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>{value ? 'Arrasta o pin para acertar o lugar' : 'Toca no mapa para marcar o lugar'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#EEF1EC' },
  pin: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: theme.colors.white, ...theme.shadow.primary,
  },
  hint: { position: 'absolute', left: 10, bottom: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  hintText: { fontSize: 12, fontFamily: theme.font.medium, color: theme.colors.textLabel },
});
