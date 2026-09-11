import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('digest', () => {
  let testContext: XFormsTestContext;

  beforeEach(() => {
    testContext = createXFormsTestContext();
  });

  [
    {
      expression: 'digest("abc", "MD5", "hex")',
      expected: '900150983cd24fb0d6963f7d28e17f72',
    },
    {
      expression: 'digest("abc", "SHA-1", "hex")',
      expected: 'a9993e364706816aba3e25717850c26c9cd0d89d',
    },
    {
      expression: 'digest("abc", "SHA-256", "hex")',
      expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    },
    {
      expression: 'digest("abc", "SHA-256")',
      expected: 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=',
    },
    {
      expression: 'digest("abc", "SHA-256", "base64")',
      expected: 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=',
    },
    {
      expression: 'digest("abc © — xyz", "MD5", "hex")',
      expected: '6f7e606a1d1174d47a3806ca7e76218c',
    },
    {
      expression: 'digest("abc © — xyz", "SHA-1", "hex")',
      expected: 'c5f99843bf4790cf2d39c13271ec6c6a8e83b270',
    },
    {
      expression: 'digest("abc © — xyz", "SHA-256", "hex")',
      expected: '03f921e8d84b143063d4a8cf2adfb944a8a50c909b04d1b513b9eed20ad499fb',
    },
    {
      expression: 'digest("abc © — xyz", "SHA-384", "hex")',
      expected:
        'ec2ef2afe5b0c4796318dbb26ebe53ed53eb2e1f4ca69f665a142d2c771e93473b32efd53b691d4133917ad5bb92f4aa',
    },
    {
      expression: 'digest("abc © — xyz", "SHA-512", "hex")',
      expected:
        '047717135c66246bbf17783dce06808d3439cf8269e148097bf2623e4600f07c199432540abc15bb7eac7fab32001d1aee3c37611164ad90c93d7631c6da24b5',
    },
    {
      expression: 'digest("abc © — xyz", "SHA-256", "base64")',
      expected: 'A/kh6NhLFDBj1KjPKt+5RKilDJCbBNG1E7nu0grUmfs=',
    },
    {
      expression: 'digest("abc © — xyz", "SHA-256")',
      expected: 'A/kh6NhLFDBj1KjPKt+5RKilDJCbBNG1E7nu0grUmfs=',
    },
    // Cyrillic: entirely outside the ASCII range
    {
      expression: 'digest("Привет", "SHA-256", "hex")',
      expected: 'dd679c0b9fd408a04148aa7d30c9df393f67b7227f65693fffe0ed6d0f0ade59',
    },
    // A surrogate pair, which must encode as four UTF-8 bytes
    {
      expression: 'digest("🎉", "SHA-256", "hex")',
      expected: '6146299cd54818a0e659eb6ac88e80f6f8f70536bbbd962d36973f2d2323f26c',
    },
  ].forEach(({ expression, expected }) => {
    it(`evaluates ${expression} to ${expected}`, () => {
      testContext.assertStringValue(expression, expected);
    });
  });
});
