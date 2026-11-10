import { Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { renderRouter, screen, act } from 'expo-router/testing-library';
import { resetTo } from '@/lib/navigation';

const page = (t: string) => () => <Text>{t}</Text>;

describe('resetTo', () => {
  it('limpa a pilha: depois de entrar, "voltar" já não leva ao ecrã de boas-vindas', async () => {
    await renderRouter({ _layout: () => <Stack />, welcome: page('Boas-vindas'), login: page('Login'), profile: page('Perfil') }, { initialUrl: '/welcome' });
    await act(async () => { router.push('/login'); });
    expect(await screen.findByText('Login')).toBeTruthy();
    expect(router.canGoBack()).toBe(true);
    await act(async () => { resetTo('/profile'); });
    expect(await screen.findByText('Perfil')).toBeTruthy();
    expect(router.canGoBack()).toBe(false);
  });
});
