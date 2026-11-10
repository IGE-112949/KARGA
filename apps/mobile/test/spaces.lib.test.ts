import { emptyDraft, locationPatch, validateLocation, validatePriceSchedule } from '@/spaces/draft';
import { ampsToKw, formatEuro, monthlyEstimate, parseEuro, scheduleSummary, weeklyHours, windowHours } from '@/lib/spaces';

describe('regras dos espaços (app)', () => {
  it.each([[8, 1.8], [10, 2.3], [13, 3.0], [16, 3.7]])('%i A → %f kW', (a, kw) => expect(ampsToKw(a)).toBe(kw));

  it('horas de uma janela: normal, meia-noite e dia todo', () => {
    expect(windowHours({ weekday: 0, startTime: '09:00', endTime: '12:30' })).toBe(3.5);
    expect(windowHours({ weekday: 0, startTime: '19:00', endTime: '08:00' })).toBe(13);
    expect(windowHours({ weekday: 0, startTime: '00:00', endTime: '24:00' })).toBe(24);
  });

  it('horas semanais e estimativa mensal (50% de ocupação)', () => {
    const ws = [0, 1, 2, 3, 4].map((weekday) => ({ weekday, startTime: '20:00', endTime: '24:00' }));
    expect(weeklyHours(ws)).toBe(20);
    expect(monthlyEstimate(ws, 0.3)).toBeCloseTo(13, 1);
  });

  it('resumo agrupa dias seguidos com o mesmo horário', () => {
    const ws = [
      ...[0, 1, 2, 3, 4].map((weekday) => ({ weekday, startTime: '19:00', endTime: '08:00' })),
      { weekday: 5, startTime: '00:00', endTime: '24:00' },
      { weekday: 6, startTime: '00:00', endTime: '24:00' },
    ];
    expect(scheduleSummary(ws)).toBe('Seg–Sex 19:00–08:00 · Sáb–Dom dia todo');
    expect(scheduleSummary([{ weekday: 2, startTime: '09:00', endTime: '12:00' }])).toBe('Qua 09:00–12:00');
    expect(scheduleSummary([])).toBe('Sem horário definido');
  });

  it('euros com vírgula', () => {
    expect(parseEuro('0,30')).toBe(0.3);
    expect(parseEuro(' 1.5 ')).toBe(1.5);
    expect(Number.isNaN(parseEuro('abc'))).toBe(true);
    expect(formatEuro(0.3)).toBe('0,30 €');
  });
});

describe('validação do rascunho', () => {
  it('dia com início igual ao fim é recusado com o nome do dia', () => {
    const d = emptyDraft();
    d.price = '0,30';
    d.days[0] = { on: true, startTime: '19:00', endTime: '19:00' };
    expect(validatePriceSchedule(d).days).toBe('Segunda: a hora de fim tem de ser diferente da de início');
  });
  it('morada com mais de 200 caracteres é recusada', () => {
    const d = { ...emptyDraft(), title: 'Garagem', address: 'R'.repeat(201), point: { latitude: 1, longitude: 1 } };
    expect(validateLocation(d).address).toBe('A morada é demasiado longa');
  });
});

describe('zona pública do espaço', () => {
  const base = { ...emptyDraft(), title: 'Garagem', point: { latitude: 1, longitude: 1 } };
  it('sem zona do GPS usa o fim da morada só se houver vírgula, sem código postal', () => {
    expect(locationPatch({ ...base, address: 'Rua X, 12, 2675-300 Odivelas' }).area).toBe('Odivelas');
    expect(locationPatch({ ...base, address: 'Rua Guilherme Gomes Fernandes 12 Odivelas' }).area).toBeNull();
    expect(locationPatch({ ...base, address: 'Rua X, 12', area: 'Loures' }).area).toBe('Loures');
  });
});

import { draftFromSpace, powerOf } from '@/spaces/draft';

describe('potência fora das opções da app', () => {
  const sp = (plugType: 'schuko' | 'type2', powerKw: number) => ({
    id: 's', title: 't', address: 'a', spotDetails: null, area: null, latitude: 0, longitude: 0, spaceType: 'covered', plugType, powerKw,
    pricePerHour: 0.3, energyPriceKwh: null, status: 'active', accessInstructions: null, accessCode: null, createdAt: '',
    photos: [], availability: [], blocks: [],
  }) as never;

  it('Schuko 2,8 kW (criado pela API) mantém-se ao editar', () => {
    expect(powerOf(draftFromSpace(sp('schuko', 2.8)))).toBe(2.8);
  });

  it('Schuko 2,3 kW corresponde a 10 A', () => {
    expect(draftFromSpace(sp('schuko', 2.3)).amps).toBe(10);
  });

  it('Tipo 2 9 kW mantém-se ao editar', () => {
    expect(powerOf(draftFromSpace(sp('type2', 9)))).toBe(9);
  });
});

import { hideTabBarOn } from '@/ui/tabBar';

describe('barra de separadores', () => {
  it('escondida no assistente de novo espaço (ecrã inteiro, como no mockup)', () => {
    expect(hideTabBarOn('/spaces/new')).toBe(true);
    expect(hideTabBarOn('/spaces')).toBe(false);
    expect(hideTabBarOn('/spaces/s1')).toBe(false);
  });
});
