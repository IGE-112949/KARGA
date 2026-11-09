// Cópia exata de apps/api/src/modules/vehicles/plate.ts — manter as duas iguais.
// Matrículas portuguesas: AA-00-00, 00-00-AA, 00-AA-00, AA-00-AA.
const PATTERNS = [/^[A-Z]{2}\d{4}$/, /^\d{4}[A-Z]{2}$/, /^\d{2}[A-Z]{2}\d{2}$/, /^[A-Z]{2}\d{2}[A-Z]{2}$/];

export function normalizePlate(input: string): string | null {
  const compact = input.replace(/[\s-]/g, '').toUpperCase();
  if (!PATTERNS.some((p) => p.test(compact))) return null;
  return `${compact.slice(0, 2)}-${compact.slice(2, 4)}-${compact.slice(4, 6)}`;
}
