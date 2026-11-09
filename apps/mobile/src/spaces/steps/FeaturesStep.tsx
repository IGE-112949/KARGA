import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Chip } from '@/ui/Chip';
import { TextField } from '@/ui/TextField';
import { Icon } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';
import { pickSpacePhoto } from '@/lib/avatar';
import { AMPS, SPACE_TYPES, WALLBOX_KW, ampsToKw, formatKw } from '@/lib/spaces';
import type { Errors } from '@/lib/validation';
import { theme } from '@/theme';
import type { SpaceDraft } from '../draft';
import { FieldError, Label, OptionCard, PlugArt, shared } from '../ui';

export const MAX_PHOTOS = 5;

export function FeaturesStep({ d, set, errors, withPhotos = true }: {
  d: SpaceDraft; set: (p: Partial<SpaceDraft>) => void; errors: Errors; withPhotos?: boolean;
}) {
  const [help, setHelp] = useState(false);

  const addPhoto = async () => {
    const p = await pickSpacePhoto().catch(() => null);
    if (p) set({ photos: [...d.photos, { uri: p.uri }] });
  };

  return (
    <View style={styles.wrap}>
      <View style={shared.section}>
        <Label>Tipo de lugar</Label>
        <View style={shared.row}>
          {SPACE_TYPES.map((t) => <Chip key={t.value} label={t.label} selected={d.spaceType === t.value} onPress={() => set({ spaceType: t.value })} />)}
        </View>
      </View>

      <View style={shared.section}>
        <Label>Tipo de tomada</Label>
        <OptionCard title="Schuko" subtitle="Tomada normal de casa" art={<PlugArt kind="schuko" />}
          selected={d.plugType === 'schuko'} onPress={() => set({ plugType: 'schuko' })} />
        <OptionCard title="Tipo 2" subtitle="Wallbox com cabo ou tomada Tipo 2" art={<PlugArt kind="type2" />}
          selected={d.plugType === 'type2'} onPress={() => set({ plugType: 'type2' })} />
        <FieldError>{errors.plugType}</FieldError>
      </View>

      {d.plugType === 'schuko' ? (
        <View style={shared.section}>
          <Label>Amperagem do carregador</Label>
          <View style={shared.row}>
            {AMPS.map((a) => <Chip key={a} label={`${a} A`} selected={d.amps === a} onPress={() => set({ amps: a })} />)}
          </View>
          <Text style={styles.hint}>≈ {formatKw(ampsToKw(d.amps))}. Vê no carregador ou na app do carro (10 A é o mais comum).</Text>
        </View>
      ) : null}

      {d.plugType === 'type2' ? (
        <View style={shared.section}>
          <Label>Potência da wallbox</Label>
          <View style={shared.row}>
            {WALLBOX_KW.map((kw) => <Chip key={kw} label={formatKw(kw)} selected={d.wallboxKw === kw} onPress={() => set({ wallboxKw: kw })} />)}
          </View>
          <Pressable accessibilityRole="link" onPress={() => setHelp(true)} hitSlop={8}>
            <Text style={styles.link}>Não sei a potência</Text>
          </Pressable>
          <FieldError>{errors.power}</FieldError>
        </View>
      ) : null}

      {withPhotos ? (
        <View style={shared.section}>
          <Label>Fotografias</Label>
          <View style={shared.row}>
            {d.photos.map((p, i) => (
              <View key={p.uri + i} style={styles.thumb}>
                <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                {i === 0 ? <Text style={styles.cover}>Capa</Text> : null}
                <Pressable accessibilityRole="button" accessibilityLabel={`Remover fotografia ${i + 1}`} hitSlop={6} style={styles.remove}
                  onPress={() => set({ photos: d.photos.filter((_, j) => j !== i) })}>
                  <Icon name="close" size={14} color={theme.colors.white} strokeWidth={2.5} />
                </Pressable>
              </View>
            ))}
            {d.photos.length < MAX_PHOTOS ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Adicionar fotografia" onPress={addPhoto} style={[styles.thumb, styles.add]}>
                <Icon name="camera" size={22} color={theme.colors.textLabel} />
                <Text style={styles.addText}>Adicionar</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.hint}>Entre 1 e 5 fotografias. A primeira é a capa.</Text>
          <FieldError>{errors.photos}</FieldError>
        </View>
      ) : null}

      <TextField label="Instruções de acesso" placeholder="Como se entra na garagem, onde fica a tomada..." multiline
        value={d.accessInstructions} error={errors.accessInstructions} onChangeText={(accessInstructions) => set({ accessInstructions })} />
      <TextField label="Código de acesso (opcional)" placeholder="ex.: código do portão" value={d.accessCode} error={errors.accessCode}
        autoCapitalize="none" autoCorrect={false} onChangeText={(accessCode) => set({ accessCode })}
        hint="Só é mostrado ao condutor com reserva, 30 min antes do início." />

      <Sheet visible={help} title="Onde vejo a potência?" onClose={() => setHelp(false)}
        message={'Está na etiqueta da wallbox (ao lado ou por baixo), na app ou no manual dela, ou pergunta a quem a instalou.\n\nSe não tiveres a certeza, escolhe 3,7 kW: o carro carrega na mesma, talvez mais devagar do que o anunciado.'}
        actions={[{ title: 'Usar 3,7 kW', variant: 'primary', onPress: () => { set({ wallboxKw: 3.7 }); setHelp(false); } }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  hint: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  link: { fontSize: 14, color: theme.colors.link, fontFamily: theme.font.semibold },
  thumb: { width: 92, height: 70, borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface },
  add: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.colors.fieldBorder, alignItems: 'center', justifyContent: 'center', gap: 2 },
  addText: { fontSize: 12, fontFamily: theme.font.medium, color: theme.colors.textLabel },
  cover: { position: 'absolute', left: 6, bottom: 6, fontSize: 11, fontFamily: theme.font.semibold, color: theme.colors.white, backgroundColor: 'rgba(19,38,58,0.7)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
  remove: { position: 'absolute', right: 5, top: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(19,38,58,0.7)', alignItems: 'center', justifyContent: 'center' },
});
