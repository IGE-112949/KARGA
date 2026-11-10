import { render, screen, act } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { SearchProvider, useSearch } from '@/search/SearchContext';
import { WhenPicker } from '@/search/WhenPicker';
import { fireEvent } from '@testing-library/react-native';

function Probe() {
  const { when, setWhen, favoriteOf, markFavorite } = useSearch();
  return (
    <>
      <Text testID="start">{when.start}</Text>
      <Text testID="fav">{String(favoriteOf('s1', false))}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="passado" onPress={() => setWhen({ dayOffset: 0, start: '00:00', hours: 2 })} />
      <Pressable accessibilityRole="button" accessibilityLabel="fav" onPress={() => markFavorite('s1', true)} />
    </>
  );
}

describe('SearchProvider', () => {
  it('uma hora de hoje que já passou é substituída pela próxima meia hora', async () => {
    const now = new Date();
    if (now.getUTCHours() < 1) return; // perto da meia-noite, 00:00 ainda não passou
    await render(<SearchProvider><Probe /></SearchProvider>);
    await fireEvent.press(screen.getByRole('button', { name: 'passado' }));
    expect(screen.getByTestId('start').props.children).not.toBe('00:00');
  });

  it('depois de avançar a hora, o valor guardado fica atualizado (não muda a cada minuto)', async () => {
    jest.useFakeTimers();
    try {
      const now = new Date();
      if (now.getUTCHours() < 1) return;
      const seen: unknown[] = [];
      function Track() {
        const { when, setWhen } = useSearch();
        seen.push(when);
        return <Pressable accessibilityRole="button" accessibilityLabel="passado" onPress={() => setWhen({ dayOffset: 0, start: '00:00', hours: 2 })} />;
      }
      await render(<SearchProvider><Track /></SearchProvider>);
      await fireEvent.press(screen.getByRole('button', { name: 'passado' }));
      const after = seen[seen.length - 1];
      await act(async () => { jest.advanceTimersByTime(180_000); });
      expect(seen[seen.length - 1]).toBe(after);
    } finally {
      jest.useRealTimers();
    }
  });

  it('marcar um favorito (no detalhe) fica visível para o mapa', async () => {
    await render(<SearchProvider><Probe /></SearchProvider>);
    expect(screen.getByTestId('fav').props.children).toBe('false');
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'fav' })); });
    expect(screen.getByTestId('fav').props.children).toBe('true');
  });
});

describe('WhenPicker', () => {
  it('não deixa recuar a chegada para uma hora de hoje que já passou', async () => {
    const at = new Date();
    if (at.getUTCHours() < 2 || at.getUTCHours() > 21) return;
    const { defaultWhen, isPastStart } = jest.requireActual('@/search/search');
    const calls: { dayOffset: number; start: string; hours: number }[] = [];
    function Ctl() {
      const [w, setW] = require('react').useState(defaultWhen(at));
      return <WhenPicker when={w} onChange={(x) => { calls.push(x); setW(x); }} />;
    }
    await render(<Ctl />);
    for (let i = 0; i < 4; i++) await fireEvent.press(screen.getByRole('button', { name: 'Chegada: menos' }));
    for (const c of calls) expect(isPastStart(c, new Date())).toBe(false);
  });
});
