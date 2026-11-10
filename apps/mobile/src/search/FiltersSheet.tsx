import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/ui/Chip';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { theme } from '@/theme';
import { KW_OPTS, NO_FILTERS, PLUG_OPTS, PRICE_OPTS, whenLabel, type Filters, type When } from './search';
import { WhenPicker } from './WhenPicker';

export function FiltersSheet({ visible, when, filters, count, onWhen, onFilters, onClose }: {
  visible: boolean; when: When; filters: Filters; count: number | null;
  onWhen: (w: When) => void; onFilters: (f: Filters) => void; onClose: () => void;
}) {
  const set = (p: Partial<Filters>) => onFilters({ ...filters, ...p });
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.h2} accessibilityRole="header">Filtros</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar filtros" onPress={onClose} hitSlop={8}><Icon name="close" size={22} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.label}>Quando</Text>
            <WhenPicker when={when} onChange={(w) => { onWhen(w); if (filters.tonight) set({ tonight: false }); }} />
            <Text style={styles.small}>{whenLabel(when)}</Text>
            <Text style={styles.label}>Preço máximo do lugar</Text>
            <View style={styles.row}>{PRICE_OPTS.map((o) => <Chip key={o.label} label={o.label} selected={filters.maxPrice === o.value} onPress={() => set({ maxPrice: o.value })} />)}</View>
            <Text style={styles.label}>Potência mínima</Text>
            <View style={styles.row}>{KW_OPTS.map((o) => <Chip key={o.label} label={o.label} selected={filters.minKw === o.value} onPress={() => set({ minKw: o.value })} />)}</View>
            <Text style={styles.label}>Tipo de ficha</Text>
            <View style={styles.row}>{PLUG_OPTS.map((o) => <Chip key={o.label} label={o.label} selected={filters.plug === o.value} onPress={() => set({ plug: o.value })} />)}</View>
          </ScrollView>
          <View style={styles.actions}>
            <View style={styles.flex}><Button title="Limpar" variant="secondary" onPress={() => onFilters(NO_FILTERS)} /></View>
            <View style={styles.flex2}>
              <Button title={count == null ? 'Ver lugares' : count === 1 ? 'Ver 1 lugar' : `Ver ${count} lugares`} onPress={onClose} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(19,38,58,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.colors.screenBg, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '88%', paddingBottom: 18 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6 },
  h2: { fontSize: 22, fontFamily: theme.font.bold, color: theme.colors.text },
  body: { paddingHorizontal: 20, gap: 12, paddingBottom: 12 },
  label: { fontSize: 15, fontFamily: theme.font.semibold, color: theme.colors.text, marginTop: 6 },
  small: { fontSize: 13, color: theme.colors.textMuted, fontFamily: theme.font.regular },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 8 },
  flex: { flex: 1 },
  flex2: { flex: 2 },
});
