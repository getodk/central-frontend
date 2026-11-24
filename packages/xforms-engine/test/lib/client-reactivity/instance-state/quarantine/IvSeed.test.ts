import * as CryptoJS from 'crypto-js';
import { describe, expect, it } from 'vitest';
import {
  arrayBufferToWordArray,
  wordArrayToArrayBuffer,
} from '../../../../../src/lib/client-reactivity/instance-state/quarantine/wordArrayUtils';
import { IvSeed } from '../../../../../src/lib/client-reactivity/instance-state/quarantine/IvSeed';

describe('IvSeed', () => {
  it('should increment correctly', () => {
    const data = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);
    const wordArray = arrayBufferToWordArray(data);
    const seed = new IvSeed('instanceid', wordArray);
    expect(wordArrayToArrayBuffer(seed.next())).toEqual(
      new Uint8Array([80, 128, 134, 204, 164, 251, 184, 114, 203, 175, 169, 233, 87, 216, 218, 82])
    );
    // second int incremented
    expect(wordArrayToArrayBuffer(seed.next())).toEqual(
      new Uint8Array([80, 129, 134, 204, 164, 251, 184, 114, 203, 175, 169, 233, 87, 216, 218, 82])
    );
    // third int incremented
    expect(wordArrayToArrayBuffer(seed.next())).toEqual(
      new Uint8Array([80, 129, 135, 204, 164, 251, 184, 114, 203, 175, 169, 233, 87, 216, 218, 82])
    );
  });

  it('wraps bytes to 0 without carrying the 1', () => {
    const wordArray = CryptoJS.enc.Utf8.parse('A'.repeat(32));
    const seed = new IvSeed('uuid:overflow', wordArray);
    const first = wordArrayToArrayBuffer(seed.next());
    const second = wordArrayToArrayBuffer(seed.next());
    expect(first[0]).toEqual(second[0]);
    expect(first[1]).toEqual(255);
    expect(second[1]).toEqual(0); // wrapped
    expect(first[2]).toEqual(second[2]);
  });
});
