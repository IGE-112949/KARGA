import { Platform } from 'react-native';
import { spaceFormData } from '@/spaces/form';

describe('multipart no telemóvel', () => {
  it('fotos vão como { uri, name, type } com append de 2 argumentos', async () => {
    Platform.OS = 'android';
    const calls: unknown[][] = [];
    const orig = FormData.prototype.append;
    FormData.prototype.append = function (...args: unknown[]) { calls.push(args); return (orig as (...a: unknown[]) => void).apply(this, args); };
    try {
      await spaceFormData({ title: 'x' }, [{ uri: 'file:///a.jpg' }]);
    } finally {
      FormData.prototype.append = orig;
    }
    expect(calls[1]).toEqual(['photos', { uri: 'file:///a.jpg', name: 'foto-1.jpg', type: 'image/jpeg' }]);
  });
});
