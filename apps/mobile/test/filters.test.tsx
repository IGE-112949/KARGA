import { render, fireEvent, screen } from '@testing-library/react-native';
import { FiltersSheet } from '@/search/FiltersSheet';
import { NO_FILTERS, PRICE_MAX } from '@/search/search';

const when = { dayOffset: 0, start: '10:00', hours: 2 };

describe('Filtros · preço máximo em barra', () => {
  it('no fim da barra é "Qualquer"; a meio mostra o valor e filtra', async () => {
    const onFilters = jest.fn();
    await render(<FiltersSheet visible when={when} filters={NO_FILTERS} count={3} onWhen={jest.fn()} onFilters={onFilters} onClose={jest.fn()} />);
    const slider = screen.getByLabelText('Preço máximo do lugar');
    expect(slider.props.value).toBe(PRICE_MAX);
    expect(screen.getByText('Qualquer preço')).toBeTruthy();
    await fireEvent(slider, 'valueChange', 0.8);
    expect(screen.getByText('Até 0,80 €/h')).toBeTruthy();
    await fireEvent(slider, 'slidingComplete', 0.8);
    expect(onFilters).toHaveBeenLastCalledWith({ ...NO_FILTERS, maxPrice: 0.8 });
    await fireEvent(slider, 'slidingComplete', PRICE_MAX);
    expect(onFilters).toHaveBeenLastCalledWith({ ...NO_FILTERS, maxPrice: null });
  });
});
