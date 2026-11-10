import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';
import { Checkbox } from '@/ui/Checkbox';
import { Text } from 'react-native';
import { singleFlight } from '@/lib/singleFlight';

describe('Button', () => {
  it('não chama onPress quando está a carregar e mostra o indicador', async () => {
    const onPress = jest.fn();
    await render(<Button title="Entrar" onPress={onPress} loading />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('button-loading')).toBeTruthy();
  });

  it('não chama onPress quando está desativado', async () => {
    const onPress = jest.fn();
    await render(<Button title="Entrar" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

});

describe('TextField', () => {
  it('mostra a mensagem de erro', async () => {
    await render(<TextField label="Email" value="" onChangeText={() => {}} error="Email inválido." />);
    expect(screen.getByText('Email inválido.')).toBeTruthy();
    expect(screen.getByText('Email')).toBeTruthy();
  });
});

describe('Checkbox', () => {
  it('chama onToggle ao tocar', async () => {
    const onToggle = jest.fn();
    await render(<Checkbox checked={false} onToggle={onToggle}><Text>Aceito</Text></Checkbox>);
    await fireEvent.press(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('singleFlight', () => {
  it('dois toques seguidos com uma promise pendente só chamam a função uma vez', async () => {
    let resolve!: () => void;
    const fn = jest.fn(() => new Promise<void>((r) => { resolve = r; }));
    const busy: boolean[] = [];
    const guarded = singleFlight(fn, (b) => busy.push(b));
    const a = guarded();
    const b = guarded();
    expect(fn).toHaveBeenCalledTimes(1);
    resolve();
    await Promise.all([a, b]);
    expect(busy).toEqual([true, false]);
    const c = guarded();
    expect(fn).toHaveBeenCalledTimes(2);
    resolve();
    await c;
  });

  it('funções síncronas não mudam o estado de ocupado', () => {
    const fn = jest.fn();
    const busy: boolean[] = [];
    singleFlight(fn, (b) => busy.push(b))();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(busy).toEqual([]);
  });
});

import { Text as RNText } from 'react-native';
import { Screen } from '@/ui/Screen';
import { MenuRow } from '@/ui/MenuRow';
import { TabBarVisibleProvider } from '@/ui/tabBarContext';

describe('Screen e a margem de baixo', () => {
  it('fora dos separadores respeita a margem de baixo', async () => {
    const v = await render(<Screen><RNText>x</RNText></Screen>);
    expect(v.getByTestId('screen-safe-area').props.edges).toMatchObject({ top: 'additive', bottom: 'additive' });
  });

  it('com a barra de separadores visível não soma a margem de baixo outra vez', async () => {
    const v = await render(<TabBarVisibleProvider value><Screen><RNText>x</RNText></Screen></TabBarVisibleProvider>);
    expect(v.getByTestId('screen-safe-area').props.edges).toMatchObject({ top: 'additive', bottom: 'off' });
  });
});

describe('MenuRow', () => {
  it('com etiqueta e sem ação, a etiqueta vai para a linha de baixo e o título não fica tapado', async () => {
    const v = await render(<MenuRow icon="card" title="Métodos de Pagamento" sub="Cartão e MB WAY" badge="Em breve" />);
    const title = v.getByText('Métodos de Pagamento');
    expect(title.props.numberOfLines).toBe(1);
    const badge = v.getByText('Em breve');
    const sub = v.getByText('Cartão e MB WAY');
    expect(badge.parent).toBe(sub.parent);
    expect(badge.parent).not.toBe(title.parent);
  });
});
