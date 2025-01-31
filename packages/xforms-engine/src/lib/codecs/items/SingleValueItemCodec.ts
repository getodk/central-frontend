import type { SharedValueCodec } from '../getSharedValueCodec.ts';
import { type CodecDecoder, type CodecEncoder } from '../ValueCodec.ts';
import { BaseItemCodec } from './BaseItemCodec.ts';
import type { MultipleValueItemCodec } from './MultipleValueItemCodec.ts';

// prettier-ignore
export type SingleValueSelectRuntimeValues =
	| readonly []
	| readonly [string];

/**
 * @see {@link encodeValueFactory}
 */
// prettier-ignore
type SingleValueSelectCodecValues =
	| SingleValueSelectRuntimeValues
	| readonly string[];

/**
 * @todo This is more permissive than it should be, allowing an array of any
 * length.  It's not clear whether a runtime check **MUST** happen here, but
 * if we identify bugs where `<select1>` controls are somehow allowing more
 * than one value to be set, this is where we'd start looking. The check is
 * skipped for now, to reduce performance overhead.
 */
const encodeValueFactory = (
	baseCodec: SharedValueCodec<'string'>
): CodecEncoder<SingleValueSelectCodecValues> => {
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
 * underlying {@link MultipleValueItemCodec}. It is implemented separately:
 *
 * 1. to address a semantic difference between `<select>` and `<select1>`
 *    values: the former are serialized as a space-separated list, but that does
 *    not apply to the latter;
 *
 * 2. as an optimization, as the more general implementation performs poorly on
 *    forms which we monitor for performance.
 */
export class SingleValueItemCodec extends BaseItemCodec<SingleValueSelectCodecValues> {
	constructor(baseCodec: SharedValueCodec<'string'>) {
		const encodeValue = encodeValueFactory(baseCodec);

		const decodeValue: CodecDecoder<SingleValueSelectRuntimeValues> = (value) => {
			if (value == null) {
				return [];
			}

			return [value];
		};

		super(baseCodec, encodeValue, decodeValue);
	}
}
