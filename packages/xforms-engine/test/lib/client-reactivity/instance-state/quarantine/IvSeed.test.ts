import * as CryptoJS from 'crypto-js';
import { describe, expect, it } from 'vitest';
import { arrayBufferToWordArray } from '../../../../../src/lib/client-reactivity/instance-state/quarantine/wordArrayUtils';
import { IvSeed } from '../../../../../src/lib/client-reactivity/instance-state/quarantine/IvSeed';

describe('IvSeed', () => {
  it('should increment correctly', () => {
    const data = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);
    const wordArray = arrayBufferToWordArray(data);
    const seed = new IvSeed('instanceid', wordArray);
    expect(seed.next()).toEqual('P\u0080\u0086Ì¤û\u00b8rË¯©éWØÚR');
    expect(seed.next()).toEqual('P\u0081\u0086Ì¤û\u00b8rË¯©éWØÚR'); // second char incremented
    expect(seed.next()).toEqual('P\u0081\u0087Ì¤û\u00b8rË¯©éWØÚR'); // third char incremented
  });

  it('wraps bytes to 0 without carrying the 1', () => {
    const toCodes = (byteString: string) =>
      byteString.split('').map((char: string) => char.charCodeAt(0));
    const wordArray = CryptoJS.enc.Utf8.parse('A'.repeat(32));
    const seed = new IvSeed('uuid:overflow', wordArray);
    const first = toCodes(seed.next());
    const second = toCodes(seed.next());
    expect(first[0]).toEqual(second[0]);
    expect(first[1]).toEqual(255);
    expect(second[1]).toEqual(0); // wrapped
    expect(first[2]).toEqual(second[2]);
  });
});
