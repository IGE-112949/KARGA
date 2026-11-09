import { normalizePlate } from '@/lib/plate';
import { validateRegister, validateVehicle } from '@/lib/validation';

describe('normalizePlate (igual à API)', () => {
  it.each([
    ['aa 12 bb', 'AA-12-BB'],
    ['12AB34', '12-AB-34'],
    ['12-34-ab', '12-34-AB'],
    ['AB-12-34', 'AB-12-34'],
  ])('%s → %s', (input, expected) => expect(normalizePlate(input)).toBe(expected));

  it.each(['ABC123', '', 'AB-CD-EF', '12-34-56', 'AB12C3'])('rejeita "%s"', (input) => expect(normalizePlate(input)).toBeNull());
});

const ok = { fullName: 'Ana Silva', email: 'ana@mail.pt', phone: '', password: 'segredo123', acceptTerms: true };

describe('validateRegister', () => {
  it('dados válidos → sem erros', () => expect(validateRegister(ok)).toEqual({}));
  it('termos por aceitar', () => expect(validateRegister({ ...ok, acceptTerms: false }).acceptTerms).toBe('Tens de aceitar os Termos e a Política de Privacidade'));
  it('password só com letras', () => expect(validateRegister({ ...ok, password: 'abcdefgh' }).password).toBeDefined());
  it('password curta', () => expect(validateRegister({ ...ok, password: 'abc123' }).password).toBeDefined());
  it('telemóvel com espaços é válido', () => expect(validateRegister({ ...ok, phone: '+351 912 345 678' }).phone).toBeUndefined());
  it('telemóvel "912" é inválido', () => expect(validateRegister({ ...ok, phone: '912' }).phone).toBe('Telemóvel inválido (usa o formato +351 912 345 678)'));
  it('nome " A " é inválido', () => expect(validateRegister({ ...ok, fullName: ' A ' }).fullName).toBe('O nome tem de ter pelo menos 2 caracteres'));
  it('email sem domínio', () => expect(validateRegister({ ...ok, email: 'ana@' }).email).toBe('Email inválido.'));
});

describe('validateVehicle', () => {
  it('matrícula inválida', () => expect(validateVehicle({ makeModel: 'Renault Zoe', plate: 'XYZ', plugType: 'type2' }).plate).toBe('Matrícula inválida (ex.: AA-00-AA)'));
  it('sem ficha', () => expect(validateVehicle({ makeModel: 'Renault Zoe', plate: 'AA-00-AA', plugType: null }).plugType).toBeDefined());
});
