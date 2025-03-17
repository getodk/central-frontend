import { identity } from '@getodk/common/lib/identity.ts';
import type { ValueType } from '../../client/ValueType.ts';
import { ValueCodec, type CodecDecoder, type CodecEncoder } from './ValueCodec.ts';

class TempUnsupportedControlEncodeError extends Error {
	constructor() {
		super(`Cannot encode state: not implemented`);
	}
}

export type TempUnsupportedRuntimeValue = unknown;
export type TempUnsupportedInputValue = unknown;

export class TempUnsupportedControlCodec<V extends ValueType> extends ValueCodec<
	V,
	TempUnsupportedRuntimeValue,
	TempUnsupportedInputValue
> {
	constructor(valueType: V) {
		const encodeValue: CodecEncoder<TempUnsupportedRuntimeValue> = (input): string => {
			if (typeof input === 'string') {
				return input;
			}

			throw new TempUnsupportedControlEncodeError();
		};

		const decodeValue: CodecDecoder<TempUnsupportedInputValue> = identity;

		super(valueType, encodeValue, decodeValue);
	}
}
