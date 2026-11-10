import { Stack } from 'expo-router';
import { theme } from '@/theme';

export default function HomeLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.screenBg } }} />;
}
