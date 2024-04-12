import { describe, expect, it } from 'vitest';
import { getBlobText } from '../../../src/lib/web-compat/blob.ts';

describe('Blob compatibility', () => {
	it('gets the text of a blob', async () => {
		const blob = new Blob(['a']);
		const text = await getBlobText(blob);

		expect(text).toBe('a');
	});
});
