import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { SelectDefinition } from '../../../client/SelectNode.ts';
import type { ValueType } from '../../../client/ValueType.ts';
import { sharedValueCodecs } from '../getSharedValueCodec.ts';
import { MultipleValueSelectCodec } from './MultipleValueSelectCodec.ts';
import { SingleValueSelectCodec } from './SingleValueSelectCodec.ts';

type MultipleValueSelectCodecs = {
	readonly [V in ValueType]: MultipleValueSelectCodec<V>;
};

const multipleValueSelectCodecs: MultipleValueSelectCodecs = {
	string: new MultipleValueSelectCodec(sharedValueCodecs.string),
	int: new MultipleValueSelectCodec(sharedValueCodecs.int),
	decimal: new MultipleValueSelectCodec(sharedValueCodecs.decimal),
	boolean: new MultipleValueSelectCodec(sharedValueCodecs.boolean),
	date: new MultipleValueSelectCodec(sharedValueCodecs.date),
	time: new MultipleValueSelectCodec(sharedValueCodecs.time),
	dateTime: new MultipleValueSelectCodec(sharedValueCodecs.dateTime),
	geopoint: new MultipleValueSelectCodec(sharedValueCodecs.geopoint),
	geotrace: new MultipleValueSelectCodec(sharedValueCodecs.geotrace),
	geoshape: new MultipleValueSelectCodec(sharedValueCodecs.geoshape),
	binary: new MultipleValueSelectCodec(sharedValueCodecs.binary),
	barcode: new MultipleValueSelectCodec(sharedValueCodecs.barcode),
	intent: new MultipleValueSelectCodec(sharedValueCodecs.intent),
};

type SingleValueSelectCodecs = {
	readonly [V in ValueType]: SingleValueSelectCodec<V>;
};

const singleValueSelectCodecs: SingleValueSelectCodecs = {
	string: new SingleValueSelectCodec(sharedValueCodecs.string),
	int: new SingleValueSelectCodec(sharedValueCodecs.int),
	decimal: new SingleValueSelectCodec(sharedValueCodecs.decimal),
	boolean: new SingleValueSelectCodec(sharedValueCodecs.boolean),
	date: new SingleValueSelectCodec(sharedValueCodecs.date),
	time: new SingleValueSelectCodec(sharedValueCodecs.time),
	dateTime: new SingleValueSelectCodec(sharedValueCodecs.dateTime),
	geopoint: new SingleValueSelectCodec(sharedValueCodecs.geopoint),
	geotrace: new SingleValueSelectCodec(sharedValueCodecs.geotrace),
	geoshape: new SingleValueSelectCodec(sharedValueCodecs.geoshape),
	binary: new SingleValueSelectCodec(sharedValueCodecs.binary),
	barcode: new SingleValueSelectCodec(sharedValueCodecs.barcode),
	intent: new SingleValueSelectCodec(sharedValueCodecs.intent),
};

// prettier-ignore
export type SelectCodec<V extends ValueType> =
	| MultipleValueSelectCodec<V>
	| SingleValueSelectCodec<V>;

export const getSelectCodec = <V extends ValueType>(
	definition: SelectDefinition<V>
): SelectCodec<V> => {
	const selectType = definition.bodyElement.type;
	const valueType = definition.valueType;

	switch (selectType) {
		case 'select':
			return multipleValueSelectCodecs[valueType];

		case 'select1':
			return singleValueSelectCodecs[valueType];

		default:
			throw new UnreachableError(selectType);
	}
};
