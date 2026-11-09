import { initialMode, resolveMode } from '@/profile/mode';

const p = (isDriver: boolean, isHost: boolean) => ({ isDriver, isHost });

describe('modo', () => {
  it('só condutor → driver', () => expect(initialMode(p(true, false))).toBe('driver'));
  it('só proprietário → host', () => expect(initialMode(p(false, true))).toBe('host'));
  it('ambos → driver', () => expect(initialMode(p(true, true))).toBe('driver'));
  it('modo guardado host com perfil só condutor → driver', () => expect(resolveMode('host', p(true, false))).toBe('driver'));
  it('modo guardado host com ambos → host', () => expect(resolveMode('host', p(true, true))).toBe('host'));
  it('valor guardado inválido → modo inicial', () => expect(resolveMode('xpto', p(false, true))).toBe('host'));
});

import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ profile: { isDriver: true, isHost: true } }) }));
import { ModeProvider, useMode } from '@/profile/ModeContext';

const seen: string[] = [];
function Show() {
  const { mode } = useMode();
  seen.push(mode);
  return <Text testID="mode">{mode}</Text>;
}

describe('ModeProvider', () => {
  it('usa o modo guardado logo na primeira renderização dos filhos', async () => {
    await AsyncStorage.setItem('karga.mode', 'host');
    await render(<ModeProvider><Show /></ModeProvider>);
    expect((await screen.findByTestId('mode')).props.children).toBe('host');
    expect(seen).not.toContain('driver');
  });
});
