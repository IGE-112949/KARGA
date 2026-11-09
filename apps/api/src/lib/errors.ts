export type ErrorDetail = { field: string; message: string };

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const unauthorized = () => new AppError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada');
