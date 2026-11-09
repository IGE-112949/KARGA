// Código Postgres de uma exceção (o Drizzle pode embrulhar o erro original em `cause`).
export function pgErrorCode(err: unknown): string | undefined {
  const e = err as { code?: unknown; cause?: { code?: unknown } };
  const code = e?.code ?? e?.cause?.code;
  return typeof code === 'string' ? code : undefined;
}

export const UNIQUE_VIOLATION = '23505';
