export class PickerError extends Error {}

// Mensagem a mostrar quando escolher/tirar uma foto falha (cancelar não é erro: o picker devolve null).
export const pickerMessage = (e: unknown) =>
  e instanceof PickerError ? e.message : 'Não foi possível abrir a galeria. Tenta novamente.';
