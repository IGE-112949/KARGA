import { useEffect } from 'react';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { redirectFor } from '@/auth/resolveStatus';

function Guard() {
  const { status } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();
  useEffect(() => {
    if (segments.length === 0) return; // o index decide
    const to = redirectFor(status, segments);
    if (to) router.replace(to as Href);
  }, [status, segments, router]);
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold });
  if (!fontsLoaded) return null;
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Guard />
    </AuthProvider>
  );
}
