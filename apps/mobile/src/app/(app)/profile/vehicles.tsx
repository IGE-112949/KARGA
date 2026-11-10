import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/ui/Screen';
import { BackButton } from '@/ui/BackButton';
import { MenuRow, menuCard } from '@/ui/MenuRow';
import { plugLabel } from '@/ui/VehicleFields';
import { theme } from '@/theme';

export default function VehiclesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  if (!profile) return null;
  const vehicles = profile.vehicles;

  return (
    <Screen background={theme.colors.screenBg} contentStyle={styles.content}>
      <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />
      <Text style={styles.h1} accessibilityRole="header">Os meus veículos</Text>
      <View style={menuCard}>
        {vehicles.length === 0 ? <Text style={styles.empty}>Ainda não adicionaste nenhum veículo.</Text> : null}
        {vehicles.map((v) => (
          <MenuRow key={v.id} icon="car" title={v.plate} sub={`${v.makeModel} · ${plugLabel(v.plugType)}`}
            badge={v.isDefault ? 'Predefinido' : undefined}
            label={`${v.makeModel}, ${v.plate}${v.isDefault ? ', Predefinido' : ''}`}
            onPress={() => router.push({ pathname: '/profile/vehicle-form', params: { id: v.id } })} />
        ))}
        <MenuRow icon="plus" title="Adicionar veículo" iconBg={theme.colors.surface} iconColor={theme.colors.textLabel} last
          onPress={() => router.push('/profile/vehicle-form')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 16 },
  h1: { fontSize: 26, fontFamily: theme.font.bold, color: theme.colors.text },
  empty: { padding: 16, fontSize: 14, color: theme.colors.textMuted, fontFamily: theme.font.regular },
});
