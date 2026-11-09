import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, type IconName } from './Icon';
import { theme } from '@/theme';

export function ComingSoon({ title, icon }: { title: string; icon: IconName }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.wrap}>
        <View style={styles.badge}><Icon name={icon} size={30} color={theme.colors.link} /></View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>Em breve</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.screenBg },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  badge: { width: 64, height: 64, borderRadius: 20, backgroundColor: theme.colors.greenBg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontFamily: theme.font.bold, color: theme.colors.text },
  sub: { fontSize: 15, color: theme.colors.textMuted, fontFamily: theme.font.regular },
});
