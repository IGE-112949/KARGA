import { Tabs } from 'expo-router';
import { Icon, type IconName } from '@/ui/Icon';
import { ModeProvider, useMode } from '@/profile/ModeContext';
import { theme } from '@/theme';

const ACTIVE = '#047857';
const MUTED = theme.colors.textMuted;

function AppTabs() {
  const { mode } = useMode();
  const driver = mode === 'driver';
  const tab = (title: string, icon: IconName, visible = true) => ({
    title,
    href: visible ? undefined : null,
    tabBarIcon: ({ color }: { color: unknown }) => <Icon name={icon} size={24} color={String(color)} />,
  });
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: { fontSize: 12, fontFamily: theme.font.semibold },
        tabBarStyle: { height: 76, paddingTop: 8, paddingBottom: 12, borderTopColor: '#EEF2F0', backgroundColor: theme.colors.white },
        sceneStyle: { backgroundColor: theme.colors.screenBg },
      }}
    >
      <Tabs.Screen name="home" options={tab(driver ? 'Mapa' : 'Início', driver ? 'map' : 'grid')} />
      <Tabs.Screen name="spaces" options={tab('Espaços', 'home', !driver)} />
      <Tabs.Screen name="bookings" options={tab('Reservas', 'calendar')} />
      <Tabs.Screen name="wallet" options={tab('Carteira', 'wallet', driver)} />
      <Tabs.Screen name="profile" options={tab('Perfil', 'user')} />
    </Tabs>
  );
}

export default function AppLayout() {
  return (
    <ModeProvider>
      <AppTabs />
    </ModeProvider>
  );
}
