import { useEffect } from 'react';
import { Stack, useSegments, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { redirectFor } from '@/auth/resolveStatus';
import { resetTo } from '@/lib/navigation';

function Guard() {
  const { status } = useAuth();
  const segments = useSegments() as string[];
  useEffect(() => {
    if (segments.length === 0) return; // o index decide
    const to = redirectFor(status, segments);
    if (to) resetTo(to as Href);
  }, [status, segments]);
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold });
  // Se as fontes falharem, segue com a letra do sistema em vez de ficar num ecrã em branco.
  if (!fontsLoaded && !fontError) return null;
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Guard />
    </AuthProvider>
  );
}
