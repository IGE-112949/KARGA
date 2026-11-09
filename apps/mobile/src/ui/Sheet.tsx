import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { theme } from '@/theme';

export type SheetAction = { title: string; onPress: () => void | Promise<unknown>; variant?: 'primary' | 'secondary' | 'danger' | 'text' };

// Folha de opções/confirmação simples (funciona igual em iOS, Android e web).
export function Sheet({ visible, title, message, actions, onClose }: {
  visible: boolean; title: string; message?: string; actions: SheetAction[]; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar">
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            {actions.map((a) => <Button key={a.title} title={a.title} variant={a.variant ?? 'secondary'} onPress={a.onPress} />)}
            <Button title="Cancelar" variant="text" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(19,38,58,0.45)', justifyContent: 'flex-end', padding: 16 },
  card: { backgroundColor: theme.colors.white, borderRadius: 24, padding: 20, gap: 10, width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { fontSize: 18, fontFamily: theme.font.semibold, color: theme.colors.text },
  message: { fontSize: 15, lineHeight: 21, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  actions: { gap: 10, marginTop: 6 },
});
