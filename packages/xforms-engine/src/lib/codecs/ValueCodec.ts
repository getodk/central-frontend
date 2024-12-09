import type { Accessor } from 'solid-js';
import type { ValueType } from '../../client/ValueType.ts';
import type { SimpleAtomicState } from '../reactivity/types.ts';

type CodecEncoder<RuntimeInputValue> = (input: RuntimeInputValue) => string;

type CodecDecoder<RuntimeValue> = (value: string) => RuntimeValue;

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

	readonly createRuntimeValueState: CreateRuntimeValueState<RuntimeValue, RuntimeInputValue>;

	constructor(
		readonly valueType: V,
		readonly encodeValue: CodecEncoder<RuntimeInputValue>,
		readonly decodeValue: CodecDecoder<RuntimeValue>,
		runtimeValueStateFactory: NoInfer<
			RuntimeValueStateFactory<RuntimeValue, RuntimeInputValue>
		> = this.defaultRuntimeValueStateFactory
	) {
		this.createRuntimeValueState = runtimeValueStateFactory(encodeValue, decodeValue);
	}
}
