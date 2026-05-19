import type { Accessor } from 'solid-js';
import type { ValueType } from '../../client/ValueType.ts';
import type { DecodeInstanceValue } from '../../instance/internal-api/InstanceValueContext.ts';
import type { SimpleAtomicState } from '../reactivity/types.ts';

export type CodecEncoder<RuntimeInputValue> = (input: RuntimeInputValue) => string;

export type CodecDecoder<RuntimeValue> = (value: string) => RuntimeValue;

type RuntimeValueAccessor<RuntimeValue> = Accessor<RuntimeValue>;

export type RuntimeValueSetter<
	RuntimeValue extends RuntimeInputValue,
	RuntimeInputValue = RuntimeValue,
> = (input: RuntimeInputValue) => RuntimeValue;

export type RuntimeValueState<
	RuntimeValue extends RuntimeInputValue,
	RuntimeInputValue = RuntimeValue,
> = readonly [
	get: RuntimeValueAccessor<RuntimeValue>,
	set: RuntimeValueSetter<RuntimeValue, RuntimeInputValue>,
];

export type CreateRuntimeValueState<
	RuntimeValue extends RuntimeInputValue,
	RuntimeInputValue = RuntimeValue,
> = (
	instanceState: SimpleAtomicState<string>
) => RuntimeValueState<RuntimeValue, RuntimeInputValue>;

type RuntimeValueStateFactory<
	RuntimeValue extends RuntimeInputValue,
	RuntimeInputValue = RuntimeValue,
> = (
	encodeValue: CodecEncoder<RuntimeInputValue>,
	decodeValue: CodecDecoder<RuntimeValue>
) => CreateRuntimeValueState<RuntimeValue, RuntimeInputValue>;

type DecodeInstanceValueFactory<
	RuntimeValue extends RuntimeInputValue,
	RuntimeInputValue = RuntimeValue,
> = (
	encodeValue: CodecEncoder<RuntimeInputValue>,
	decodeValue: CodecDecoder<RuntimeValue>
) => DecodeInstanceValue;

interface ValueCodecOptions<RuntimeValue extends RuntimeInputValue, RuntimeInputValue> {
	readonly decodeInstanceValueFactory?: DecodeInstanceValueFactory<RuntimeValue, RuntimeInputValue>;
	readonly runtimeValueStateFactory?: RuntimeValueStateFactory<RuntimeValue, RuntimeInputValue>;
}

export abstract class ValueCodec<
	V extends ValueType,
	RuntimeValue extends RuntimeInputValue,
	RuntimeInputValue = RuntimeValue,
> {
	protected readonly defaultRuntimeValueStateFactory: RuntimeValueStateFactory<
		RuntimeValue,
		RuntimeInputValue
	> = (encodeValue, decodeValue) => {
		return (instanceState) => {
			const [getInstanceValue, setInstanceValue] = instanceState;

			const getValue = (): RuntimeValue => {
				return decodeValue(getInstanceValue());
			};

			const setValue = (runtimeValue: RuntimeInputValue): RuntimeValue => {
				const encodedValue = encodeValue(runtimeValue);
				const persistedValue = setInstanceValue(encodedValue);

				return decodeValue(persistedValue);
			};

			return [getValue, setValue];
		};
	};

	protected readonly defaultDecodeInstanceValueFactory: DecodeInstanceValueFactory<
		RuntimeValue,
		RuntimeInputValue
	> = (encodeValue, decodeValue) => {
		return (instanceValue) => {
			return encodeValue(decodeValue(instanceValue));
		};
	};

	readonly decodeInstanceValue: DecodeInstanceValue;
	readonly createRuntimeValueState: CreateRuntimeValueState<RuntimeValue, RuntimeInputValue>;

	constructor(
		readonly valueType: V,
		readonly encodeValue: CodecEncoder<RuntimeInputValue>,
		readonly decodeValue: CodecDecoder<RuntimeValue>,
		options: ValueCodecOptions<RuntimeValue, RuntimeInputValue> = {}
	) {
		const {
			decodeInstanceValueFactory = this.defaultDecodeInstanceValueFactory,
			runtimeValueStateFactory = this.defaultRuntimeValueStateFactory,
		} = options;

		this.decodeInstanceValue = decodeInstanceValueFactory(encodeValue, decodeValue);
		this.createRuntimeValueState = runtimeValueStateFactory(encodeValue, decodeValue);
	}
}
