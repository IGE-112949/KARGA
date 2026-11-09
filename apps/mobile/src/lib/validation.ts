import { ApiError } from './api';
import { normalizePlate } from './plate';
import type { PlugType } from './types';

// Mesmas regras e mensagens da API (apps/api/src/modules/*/schemas.ts), para avisar antes de enviar.
export type Errors = Record<string, string>;

export const cleanPhone = (s: string) => s.replace(/[\s-]/g, '');

export function validateName(fullName: string): string | undefined {
  const n = fullName.trim();
  if (!n) return 'Indica o teu nome';
  if (n.length < 2) return 'O nome tem de ter pelo menos 2 caracteres';
  if (n.length > 100) return 'O nome é demasiado longo';
}

export function validatePhone(phone: string): string | undefined {
  const p = cleanPhone(phone);
  if (p && !/^\+[1-9]\d{7,14}$/.test(p)) return 'Telemóvel inválido (usa o formato +351 912 345 678)';
}

export function validateRegister(f: { fullName: string; email: string; phone: string; password: string; acceptTerms: boolean }): Errors {
  const e: Errors = {};
  const name = validateName(f.fullName);
  if (name) e.fullName = name;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Email inválido.';
  const phone = validatePhone(f.phone);
  if (phone) e.phone = phone;
  if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) {
    e.password = 'A password tem de ter pelo menos 8 caracteres, com letras e números.';
  }
  if (!f.acceptTerms) e.acceptTerms = 'Tens de aceitar os Termos e a Política de Privacidade';
  return e;
}

export function validateVehicle(f: { makeModel: string; plate: string; plugType: PlugType | null }): Errors {
  const e: Errors = {};
  const mm = f.makeModel.trim();
  if (!mm) e.makeModel = 'Indica a marca e o modelo';
  else if (mm.length < 2) e.makeModel = 'Marca/modelo demasiado curto';
  else if (mm.length > 60) e.makeModel = 'Marca/modelo demasiado longo';
  if (!f.plate.trim()) e.plate = 'Indica a matrícula';
  else if (!normalizePlate(f.plate)) e.plate = 'Matrícula inválida (ex.: AA-00-AA)';
  if (!f.plugType) e.plugType = 'Escolhe o tipo de ficha';
  return e;
}

// Erros da API por campo; PLATE_TAKEN vai para a matrícula. O resto fica em `form`.
export function apiFieldErrors(err: unknown): Errors {
  if (!(err instanceof ApiError)) return { form: 'Ocorreu um erro. Tenta novamente.' };
  if (err.code === 'PLATE_TAKEN') return { plate: err.message };
  if (err.details?.length) return Object.fromEntries(err.details.map((d) => [d.field, d.message]));
  return { form: err.message };
}
