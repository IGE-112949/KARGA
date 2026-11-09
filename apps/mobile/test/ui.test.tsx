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
