import type { ValueType } from '../../../client/ValueType.ts';
import type { SharedValueCodec } from '../getSharedValueCodec.ts';
import { ValueArrayCodec, type RuntimeItemValue, type RuntimeValues } from '../ValueArrayCodec.ts';
import { type CodecDecoder, type CodecEncoder } from '../ValueCodec.ts';
import type { MultipleValueSelectCodec } from './MultipleValueSelectCodec.ts';

// prettier-ignore
export type SingleValueSelectRuntimeValues<V extends ValueType> =
	| readonly []
	| readonly [RuntimeItemValue<V>];

/**
 * @see {@link encodeValueFactory}
 */
// prettier-ignore
type SingleValueSelectCodecValues<V extends ValueType> =
	| RuntimeValues<V>
	| SingleValueSelectRuntimeValues<V>;

/**
 * @todo This is more permissive than it should be, allowing an array of any
 * length.  It's not clear whether a runtime check **MUST** happen here, but
 * if we identify bugs where `<select1>` controls are somehow allowing more
 * than one value to be set, this is where we'd start looking. The check is
 * skipped for now, to reduce performance overhead.
 */
const encodeValueFactory = <V extends ValueType>(
	baseCodec: SharedValueCodec<V>
): CodecEncoder<SingleValueSelectCodecValues<V>> => {
	return (values) => {
		const [value] = values;

		if (value == null) {
			return '';
		}

		return baseCodec.encodeValue(value);
	};
};

/**
 * Value codec implementation for `<select1>` controls.
 *
 * Note: this implementation is a specialization of the same principles
 * underlying {@link MultipleValueSelectCodec}. It is implemented separately:
 *
 * 1. to address a semantic difference between `<select>` and `<select1>`
 *    values: the former are serialized as a space-separated list, but that does
 *    not apply to the latter;
 *
 * 2. as an optimization, as the more general implementation performs poorly on
 *    forms which we monitor for performance.
 */
export class SingleValueSelectCodec<V extends ValueType> extends ValueArrayCodec<
	V,
	SingleValueSelectCodecValues<V>
> {
	constructor(baseCodec: SharedValueCodec<V>) {
		const encodeValue = encodeValueFactory(baseCodec);

		const decodeValue: CodecDecoder<SingleValueSelectRuntimeValues<V>> = (value) => {
			const decoded = baseCodec.decodeValue(value);

			if (decoded == null) {
				return [];
			}

			return [decoded];
		};

		super(baseCodec, encodeValue, decodeValue);
	}
}
