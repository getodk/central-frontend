import type { ValueType } from '../../../client';
import { type CodecDecoder, type CodecEncoder, ValueCodec } from '../ValueCodec.ts';

export function createGeolocationValueCodec<
	V extends ValueType,
	RuntimeValue extends RuntimeInputValue,
	RuntimeInputValue = RuntimeValue,
>(
	valueType: V,
	encodeValue: CodecEncoder<RuntimeInputValue>,
	decodeValue: CodecDecoder<RuntimeValue>
): ValueCodec<V, RuntimeValue, RuntimeInputValue> {
	return new (class extends ValueCodec<V, RuntimeValue, RuntimeInputValue> {})(
		valueType,
		encodeValue,
		decodeValue
	);
}
