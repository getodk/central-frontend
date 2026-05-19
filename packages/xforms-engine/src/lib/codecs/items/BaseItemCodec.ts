import type { ValueType } from '../../../client/ValueType.ts';
import type { SharedValueCodec } from '../getSharedValueCodec.ts';
import { ValueArrayCodec } from '../ValueArrayCodec.ts';
import type { CodecDecoder, CodecEncoder } from '../ValueCodec.ts';

export type BaseItemValueType = 'string';

export type UnsupportedBaseItemValueType = Exclude<ValueType, BaseItemValueType>;

export abstract class BaseItemCodec<
	Values extends readonly string[] = readonly string[],
> extends ValueArrayCodec<BaseItemValueType, Values> {
	constructor(
		baseCodec: SharedValueCodec<'string'>,
		encodeValue: CodecEncoder<Values>,
		decodeValue: CodecDecoder<Values>
	) {
		super(baseCodec, encodeValue, decodeValue);
	}
}
