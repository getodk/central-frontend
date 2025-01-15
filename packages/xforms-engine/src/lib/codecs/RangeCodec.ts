import type { RangeValue } from '../../client/RangeNode.ts';
import { ValueTypeInvariantError } from '../../error/ValueTypeInvariantError.ts';
import type { RangeNodeDefinition, RangeValueType } from '../../parse/model/RangeNodeDefinition.ts';
import type { RuntimeInputValue, RuntimeValue, SharedValueCodec } from './getSharedValueCodec.ts';
import { ValueCodec } from './ValueCodec.ts';

export type RangeRuntimeValue<V extends RangeValueType> = RuntimeValue<V>;

export type RangeInputValue<V extends RangeValueType> = RuntimeInputValue<V>;

export class RangeCodec<V extends RangeValueType> extends ValueCodec<
	V,
	RangeRuntimeValue<V>,
	RangeInputValue<V>
> {
	constructor(baseCodec: SharedValueCodec<V>, definition: RangeNodeDefinition<V>) {
		const { valueType, bounds } = definition;
		const { min, max } = bounds;

		type ComparableRangeValue = bigint | number | null;

		const toComparableValue = (value: RangeInputValue<V>): ComparableRangeValue => {
			if (value == null) {
				return value;
			}

			if (typeof value === 'string') {
				return baseCodec.decodeValue(value);
			}

			return value;
		};

		const assertBounds = (value: RuntimeInputValue<V>) => {
			const comparableValue = toComparableValue(value);

			if (comparableValue == null) {
				return;
			}

			if (comparableValue < min || comparableValue > max) {
				throw new ValueTypeInvariantError(
					valueType,
					`Expected value to be within bounds [${min}, ${max}]. Got: ${value}`
				);
			}
		};

		const encodeValue = (value: RangeInputValue<V>): string => {
			assertBounds(value);

			return baseCodec.encodeValue(value);
		};

		const decodeValue = (value: string): RangeValue<V> => {
			const decoded = baseCodec.decodeValue(value);

			assertBounds(value);

			return decoded;
		};

		super(valueType, encodeValue, decodeValue);
	}
}
