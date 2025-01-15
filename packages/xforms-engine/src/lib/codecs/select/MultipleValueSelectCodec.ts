import { xmlXPathWhitespaceSeparatedList } from '@getodk/common/lib/string/whitespace.ts';
import type { ValueType } from '../../../client/ValueType.ts';
import type { SharedValueCodec } from '../getSharedValueCodec.ts';
import type { RuntimeValues } from '../ValueArrayCodec.ts';
import { ValueArrayCodec } from '../ValueArrayCodec.ts';
import type { CodecDecoder, CodecEncoder } from '../ValueCodec.ts';

/**
 * Value codec implementation for `<select>` controls.
 *
 * This generalizes the application of a {@link SharedValueCodec} implementation
 * over individual select values, where those values are serialized as a
 * whitespace-separated list. All other encoding and decoding logic is deferred
 * to the provided {@link baseCodec}, ensuring that select value types are
 * treated consistently with the same underlying data types for other controls.
 */
export class MultipleValueSelectCodec<V extends ValueType> extends ValueArrayCodec<V> {
	constructor(baseCodec: SharedValueCodec<V>) {
		const encodeValue: CodecEncoder<RuntimeValues<V>> = (value) => {
			return value.map(baseCodec.encodeValue).join(' ');
		};
		const decodeValue: CodecDecoder<RuntimeValues<V>> = (value) => {
			const instanceValues = xmlXPathWhitespaceSeparatedList(value, {
				ignoreEmpty: true,
			});

			return instanceValues.map(this.decodeItemValue);
		};

		super(baseCodec, encodeValue, decodeValue);
	}
}
