import type { RangeValue } from '../../client/RangeNode.ts';
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
		const { start, end } = bounds;

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

		const assertBounds = (value: RuntimeInputValue<V>): boolean => {
			const comparableValue = toComparableValue(value);
			return comparableValue != null && comparableValue >= start && comparableValue <= end;
		};

		const encodeValue = (value: RangeInputValue<V>): string => {
			return baseCodec.encodeValue(assertBounds(value) ? value : null);
		};

		const decodeValue = (value: string): RangeValue<V> => {
			const decoded = baseCodec.decodeValue(value);

			if (assertBounds(decoded)) {
				return decoded;
			}

			return null;
		};

		super(valueType, encodeValue, decodeValue);
	}
}
