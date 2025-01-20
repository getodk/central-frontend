import { xmlXPathWhitespaceSeparatedList } from '@getodk/common/lib/string/whitespace.ts';
import type { SharedValueCodec } from '../getSharedValueCodec.ts';
import type { CodecDecoder, CodecEncoder } from '../ValueCodec.ts';
import { BaseSelectCodec } from './BaseSelectCodec.ts';

/**
 * Value codec implementation for `<select>` controls.
 *
 * This generalizes the application of a {@link SharedValueCodec} implementation
 * over individual select values, where those values are serialized as a
 * whitespace-separated list. All other encoding and decoding logic is deferred
 * to the provided {@link baseCodec}, ensuring that select value types are
 * treated consistently with the same underlying data types for other controls.
 */
export class MultipleValueSelectCodec extends BaseSelectCodec<readonly string[]> {
	constructor(baseCodec: SharedValueCodec<'string'>) {
		const encodeValue: CodecEncoder<readonly string[]> = (value) => {
			return value.join(' ');
		};
		const decodeValue: CodecDecoder<readonly string[]> = (value) => {
			return xmlXPathWhitespaceSeparatedList(value, {
				ignoreEmpty: true,
			});
		};

		super(baseCodec, encodeValue, decodeValue);
	}
}
