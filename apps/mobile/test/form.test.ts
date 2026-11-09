import { Platform } from 'react-native';

jest.mock('expo-file-system', () => ({
  File: class {
    uri: string;
    constructor(mockUri: string) { this.uri = mockUri; }
    name = 'a.jpg';
    type = 'image/jpeg';
    async bytes() { return new Uint8Array([0xff, 0xd8, 0xff]); }
  },
}));

import { spaceFormData } from '@/spaces/form';
import { avatarFormData } from '@/lib/avatar';

function captureAppends() {
  const calls: unknown[][] = [];
  const orig = FormData.prototype.append;
  FormData.prototype.append = function (...args: unknown[]) { calls.push(args); return (orig as (...a: unknown[]) => void).apply(this, args); };
  return { calls, restore: () => { FormData.prototype.append = orig; } };
}

describe('multipart no telemóvel (fetch do Expo)', () => {
  beforeEach(() => { Platform.OS = 'android'; });

  it('fotos do espaço vão como File do expo-file-system (com bytes())', async () => {
    const { calls, restore } = captureAppends();
    try {
      await spaceFormData({ title: 'x' }, [{ uri: 'file:///a.jpg' }]);
    } finally {
      restore();
    }
    const part = calls[1][1] as { uri: string; bytes: unknown };
    expect(calls[1][0]).toBe('photos');
    expect(part.uri).toBe('file:///a.jpg');
    expect(typeof part.bytes).toBe('function');
  });

  it('foto de perfil usa o mesmo formato', async () => {
    const { calls, restore } = captureAppends();
    try {
      await avatarFormData('file:///b.jpg');
    } finally {
      restore();
    }
    expect(typeof (calls[0][1] as { bytes: unknown }).bytes).toBe('function');
  });
});
