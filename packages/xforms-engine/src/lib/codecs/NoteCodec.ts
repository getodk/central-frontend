import type { ValueType } from '../../client/ValueType.ts';
import type { RuntimeInputValue, RuntimeValue, SharedValueCodec } from './getSharedValueCodec.ts';
import { ValueCodec } from './ValueCodec.ts';

// prettier-ignore
export type NoteRuntimeValue<V extends ValueType> =
	| RuntimeValue<V>
	| null;

// prettier-ignore
export type NoteInputValue<V extends ValueType> =
	| RuntimeInputValue<V>
	| RuntimeValue<V>
	| null;

export class NoteCodec<V extends ValueType> extends ValueCodec<
	V,
	NoteRuntimeValue<V>,
	NoteInputValue<V>
> {
	constructor(baseCodec: SharedValueCodec<V>) {
		const encodeValue = (value: NoteInputValue<V>): string => {
			return baseCodec.encodeValue(value ?? '');
		};

		const decodeValue = (value: string): NoteRuntimeValue<V> => {
			return value === '' ? null : baseCodec.decodeValue(value);
		};

		super(baseCodec.valueType, encodeValue, decodeValue);
	}
}
