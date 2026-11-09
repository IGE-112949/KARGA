// Evita pedidos duplicados: enquanto a promise anterior não termina, novas chamadas são ignoradas.
export function singleFlight(fn: () => void | Promise<unknown>, onBusy: (busy: boolean) => void) {
  let running = false;
  return async () => {
    if (running) return;
    const result = fn();
    if (!result || typeof (result as Promise<unknown>).then !== 'function') return;
    running = true;
    onBusy(true);
    try {
      await result;
    } finally {
      running = false;
      onBusy(false);
    }
  };
}
