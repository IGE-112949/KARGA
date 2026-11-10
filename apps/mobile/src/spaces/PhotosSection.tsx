import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { PhotoSource } from '@/lib/avatar';
import { AddPhotoTile } from './AddPhotoTile';
import { Sheet } from '@/ui/Sheet';
import type { SpacePhoto } from '@/lib/spaces';
import { theme } from '@/theme';
import { MAX_PHOTOS } from './steps/FeaturesStep';

export function PhotosSection({ photos, onAdd, onCover, onRemove }: {
  photos: SpacePhoto[]; onAdd: (source: PhotoSource) => Promise<void>; onCover: (id: string) => Promise<void>; onRemove: (id: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<SpacePhoto | null>(null);
  const run = (fn: (id: string) => Promise<void>) => async () => {
    const p = selected;
    setSelected(null);
    if (p) await fn(p.id);
  };
  return (
    <View style={styles.row}>
      {photos.map((p, i) => (
        <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Fotografia ${i + 1}`} onPress={() => setSelected(p)} style={styles.thumb}>
          <Image source={{ uri: p.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          {p.isCover ? <Text style={styles.cover}>Capa</Text> : null}
        </Pressable>
      ))}
      {photos.length < MAX_PHOTOS ? <AddPhotoTile onPick={onAdd} /> : null}
      <Sheet visible={!!selected} title="Fotografia" onClose={() => setSelected(null)}
        actions={[
          ...(selected && !selected.isCover ? [{ title: 'Tornar capa', variant: 'primary' as const, onPress: run(onCover) }] : []),
          { title: 'Remover fotografia', variant: 'danger', onPress: run(onRemove) },
        ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 92, height: 70, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface },
  cover: { position: 'absolute', left: 6, bottom: 6, fontSize: 11, fontFamily: theme.font.semibold, color: theme.colors.white, backgroundColor: 'rgba(19,38,58,0.7)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
});
