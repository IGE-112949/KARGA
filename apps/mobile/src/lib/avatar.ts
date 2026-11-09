import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export type PickedImage = { uri: string; mimeType: 'image/jpeg' };

// Escolhe uma foto da galeria, cortada em quadrado, e reduz para 512×512 JPEG.
export async function pickAvatar(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  if (res.canceled || !res.assets[0]) return null;
  const ctx = ImageManipulator.manipulate(res.assets[0].uri);
  ctx.resize({ width: 512, height: 512 });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return { uri: out.uri, mimeType: 'image/jpeg' };
}

// Foto de um espaço: galeria, recorte 4:3, reduzida para 1280 px de largura (JPEG).
export async function pickSpacePhoto(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 1 });
  if (res.canceled || !res.assets[0]) return null;
  const ctx = ImageManipulator.manipulate(res.assets[0].uri);
  ctx.resize({ width: 1280 });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return { uri: out.uri, mimeType: 'image/jpeg' };
}

// Junta uma imagem ao multipart. No telemóvel o fetch do Expo (SDK 58) só aceita ficheiros do expo-file-system
// (objetos { uri, name, type } dão "Unsupported FormDataPart implementation").
export async function appendImage(form: FormData, field: string, uri: string, name: string): Promise<void> {
  if (Platform.OS === 'web') form.append(field, await (await fetch(uri)).blob(), name);
  else form.append(field, new File(uri) as unknown as Blob);
}

// Corpo multipart para PUT /me/avatar (campo `file`).
export async function avatarFormData(uri: string): Promise<FormData> {
  const form = new FormData();
  await appendImage(form, 'file', uri, 'avatar.jpg');
  return form;
}
