import type { ValueType } from '../../../client/ValueType.ts';
import type { SharedValueCodec } from '../getSharedValueCodec.ts';
import { ValueArrayCodec } from '../ValueArrayCodec.ts';
import type { CodecDecoder, CodecEncoder } from '../ValueCodec.ts';

export type SelectValueType = 'string';

export type UnsupportedSelectValueType = Exclude<ValueType, SelectValueType>;

export abstract class BaseSelectCodec<
	Values extends readonly string[] = readonly string[],
> extends ValueArrayCodec<SelectValueType, Values> {
	constructor(
		baseCodec: SharedValueCodec<'string'>,
		encodeValue: CodecEncoder<Values>,
		decodeValue: CodecDecoder<Values>
	) {
		super(baseCodec, encodeValue, decodeValue);
	}
}
