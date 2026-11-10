import type { LatLng } from '@/lib/location';
import { WEEKDAY_NAMES, ampsToKw, kwToAmps, parseEuro, type Space, type SpacePlug, type SpaceType, type Window } from '@/lib/spaces';
import type { Errors } from '@/lib/validation';

export type DayDraft = { on: boolean; startTime: string; endTime: string };

// Estado do formulário do espaço (assistente e edição).
export type SpaceDraft = {
  title: string;
  address: string;
  spotDetails: string;
  area: string;
  point: LatLng | null;
  spaceType: SpaceType;
  plugType: SpacePlug | null;
  amps: number;
  wallboxKw: number | null;
  photos: { uri: string }[];
  accessInstructions: string;
  accessCode: string;
  price: string;
  energy: string;
  days: DayDraft[];
};

export const DEFAULT_DAY: DayDraft = { on: false, startTime: '19:00', endTime: '08:00' };

export const emptyDraft = (): SpaceDraft => ({
  title: '', address: '', spotDetails: '', area: '', point: null, spaceType: 'closed_garage', plugType: null, amps: 10, wallboxKw: null,
  photos: [], accessInstructions: '', accessCode: '', price: '', energy: '',
  days: Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY })),
});

const euro = (v: number | null) => (v == null ? '' : String(Number(v.toFixed(3))).replace('.', ','));

export function draftFromSpace(s: Space): SpaceDraft {
  const days = Array.from({ length: 7 }, (_, i) => {
    const w = s.availability.find((a) => a.weekday === i);
    return w ? { on: true, startTime: w.startTime, endTime: w.endTime } : { ...DEFAULT_DAY };
  });
  return {
    title: s.title, address: s.address, spotDetails: s.spotDetails ?? '', area: s.area ?? '', point: { latitude: s.latitude, longitude: s.longitude },
    spaceType: s.spaceType, plugType: s.plugType,
    amps: s.plugType === 'schuko' ? kwToAmps(s.powerKw) : 10, wallboxKw: s.plugType === 'type2' ? s.powerKw : null,
    photos: s.photos.map((p) => ({ uri: p.url })), accessInstructions: s.accessInstructions ?? '', accessCode: s.accessCode ?? '',
    price: s.pricePerHour.toFixed(2).replace('.', ','), energy: euro(s.energyPriceKwh), days,
  };
}

export const powerOf = (d: SpaceDraft): number | null =>
  d.plugType === 'schuko' ? ampsToKw(d.amps) : d.plugType === 'type2' ? d.wallboxKw : null;

export const windowsOf = (d: SpaceDraft): Window[] =>
  d.days.flatMap((x, weekday) => (x.on ? [{ weekday, startTime: x.startTime, endTime: x.endTime }] : []));

export function validateLocation(d: SpaceDraft): Errors {
  const e: Errors = {};
  const t = d.title.trim();
  if (t.length < 3) e.title = 'O nome tem de ter pelo menos 3 caracteres';
  else if (t.length > 60) e.title = 'O nome é demasiado longo';
  if (d.address.trim().length < 5) e.address = 'Indica a morada';
  else if (d.address.trim().length > 200) e.address = 'A morada é demasiado longa';
  if (!d.point) e.point = 'Marca o lugar no mapa';
  if (d.spotDetails.length > 60) e.spotDetails = 'Demasiado longo';
  return e;
}

export function validateFeatures(d: SpaceDraft, withPhotos: boolean): Errors {
  const e: Errors = {};
  if (!d.plugType) e.plugType = 'Escolhe o tipo de ficha';
  else if (d.plugType === 'type2' && !d.wallboxKw) e.power = 'Escolhe a potência da wallbox';
  if (withPhotos && d.photos.length === 0) e.photos = 'Adiciona pelo menos uma fotografia.';
  if (d.accessInstructions.length > 500) e.accessInstructions = 'Demasiado longo';
  if (d.accessCode.trim().length > 20) e.accessCode = 'Máximo 20 caracteres';
  return e;
}

export function validatePriceSchedule(d: SpaceDraft): Errors {
  const e: Errors = {};
  const p = parseEuro(d.price);
  if (Number.isNaN(p) || p < 0.1 || p > 20) e.price = 'Indica um preço entre 0,10 € e 20 € por hora';
  if (d.energy.trim()) {
    const en = parseEuro(d.energy);
    if (Number.isNaN(en) || en < 0.05 || en > 1) e.energy = 'Entre 0,05 € e 1 € por kWh (ou deixa vazio)';
  }
  if (!d.days.some((x) => x.on)) e.days = 'Escolhe pelo menos um dia';
  const same = d.days.findIndex((x) => x.on && x.startTime === x.endTime);
  if (same >= 0) e.days = `${WEEKDAY_NAMES[same]}: a hora de fim tem de ser diferente da de início`;
  return e;
}

const textOrNull = (s: string) => s.trim() || null;
// Sem zona do GPS: usa a parte da morada depois da última vírgula (ex.: "…, 2675-300 Odivelas" → "Odivelas"),
// só se houver vírgula e sem números — a zona é pública e não pode revelar a morada.
const fallbackArea = (address: string) => {
  if (!address.includes(',')) return null;
  const a = (address.split(',').pop() ?? '').replace(/\b\d{4}-\d{3}\b/g, ' ').replace(/\s+/g, ' ').trim();
  return a && !/\d/.test(a) ? a : null;
};

export const locationPatch = (d: SpaceDraft) => ({
  title: d.title.trim(), address: d.address.trim(), spotDetails: textOrNull(d.spotDetails),
  area: textOrNull(d.area) ?? fallbackArea(d.address),
  latitude: d.point!.latitude, longitude: d.point!.longitude,
});

export const featuresPatch = (d: SpaceDraft) => ({
  spaceType: d.spaceType, plugType: d.plugType!, powerKw: powerOf(d)!,
  accessInstructions: textOrNull(d.accessInstructions), accessCode: textOrNull(d.accessCode),
});

export const pricePatch = (d: SpaceDraft) => ({
  pricePerHour: parseEuro(d.price), energyPriceKwh: d.energy.trim() ? parseEuro(d.energy) : null,
});

export const createPayload = (d: SpaceDraft) => ({
  ...locationPatch(d), ...featuresPatch(d), ...pricePatch(d), availability: windowsOf(d),
});
