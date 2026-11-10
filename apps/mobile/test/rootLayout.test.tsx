import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

let mockFonts: [boolean, Error | null] = [false, null];
jest.mock('@expo-google-fonts/outfit', () => ({ useFonts: () => mockFonts }));
jest.mock('@/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ status: 'loading' }),
}));
jest.mock('expo-router', () => {
  const { Text: T } = jest.requireActual('react-native');
  return { Stack: () => <T>app</T>, useSegments: () => [] };
});

import RootLayout from '@/app/_layout';

describe('RootLayout', () => {
  it('enquanto as fontes carregam não mostra nada', async () => {
    mockFonts = [false, null];
    await render(<RootLayout />);
    expect(screen.queryByText('app')).toBeNull();
  });

  it('se as fontes falharem, abre a app na mesma (com a letra do sistema)', async () => {
    mockFonts = [false, new Error('sem fontes')];
    await render(<RootLayout />);
    expect(screen.getByText('app')).toBeTruthy();
  });
});
