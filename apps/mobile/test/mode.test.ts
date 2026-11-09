import { initialMode, resolveMode } from '@/profile/mode';

const p = (isDriver: boolean, isHost: boolean) => ({ isDriver, isHost });

describe('modo', () => {
  it('só condutor → driver', () => expect(initialMode(p(true, false))).toBe('driver'));
  it('só proprietário → host', () => expect(initialMode(p(false, true))).toBe('host'));
  it('ambos → driver', () => expect(initialMode(p(true, true))).toBe('driver'));
  it('modo guardado host com perfil só condutor → driver', () => expect(resolveMode('host', p(true, false))).toBe('driver'));
  it('modo guardado host com ambos → host', () => expect(resolveMode('host', p(true, true))).toBe('host'));
  it('valor guardado inválido → modo inicial', () => expect(resolveMode('xpto', p(false, true))).toBe('host'));
});
