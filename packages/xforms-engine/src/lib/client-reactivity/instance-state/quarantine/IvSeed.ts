import * as CryptoJS from 'crypto-js';
import { wordArrayToArrayBuffer } from './wordArrayUtils';

export class IvSeed {
  private readonly SEED_ARRAY_LENGTH = 16; // guaranteed by the md5 algorithm
  readonly ivSeedArray;
  private counter = 0;

  public constructor(
    readonly instanceId: string,
    readonly symmetricKey: CryptoJS.lib.WordArray
  ) {
    const md = CryptoJS.algo.MD5.create();
    md.update(instanceId);
    md.update(symmetricKey);
    this.ivSeedArray = wordArrayToArrayBuffer(md.finalize());
  }

  next(): string {
    ++this.ivSeedArray[this.counter % this.SEED_ARRAY_LENGTH]!;
    ++this.counter;
    return String.fromCharCode(...new Uint8Array(this.ivSeedArray));
  }
}
