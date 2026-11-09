import { Stack } from 'expo-router';
import { theme } from '@/theme';

export default function SpacesLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.screenBg } }} />;
}
