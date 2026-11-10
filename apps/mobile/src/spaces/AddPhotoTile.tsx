import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Icon } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';
import type { PhotoSource } from '@/lib/avatar';
import { theme } from '@/theme';

// Quadrado "Adicionar" das fotografias: pergunta se é para tirar uma foto ou escolher da galeria.
export function AddPhotoTile({ onPick }: { onPick: (source: PhotoSource) => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const pick = (source: PhotoSource) => async () => {
    setOpen(false);
    await onPick(source);
  };
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Adicionar fotografia" onPress={() => setOpen(true)} style={styles.tile}>
        <Icon name="camera" size={22} color={theme.colors.textLabel} />
        <Text style={styles.text}>Adicionar</Text>
      </Pressable>
      <Sheet visible={open} title="Adicionar fotografia" onClose={() => setOpen(false)}
        actions={[
          { title: 'Tirar fotografia', variant: 'primary', onPress: pick('camera') },
          { title: 'Escolher da galeria', variant: 'secondary', onPress: pick('library') },
        ]} />
    </>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 92, height: 70, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.colors.fieldBorder, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  text: { fontSize: 12, fontFamily: theme.font.medium, color: theme.colors.textLabel },
});
