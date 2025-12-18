import type { ValueType } from '../../client/ValueType.ts';
import type { DatetimeInputValue, DatetimeRuntimeValue } from './DateValueCodec.ts';
import { DateValueCodec } from './DateValueCodec.ts';
import {
	type DecimalInputValue,
	type DecimalRuntimeValue,
	DecimalValueCodec,
} from './DecimalValueCodec.ts';
import { createGeolocationValueCodec } from './geolocation/createGeolocationValueCodec.ts';
import {
	Geopoint,
	type GeopointInputValue,
	type GeopointRuntimeValue,
} from './geolocation/Geopoint.ts';
import {
	Geoshape,
	type GeoshapeInputValue,
	type GeoshapeRuntimeValue,
} from './geolocation/Geoshape.ts';
import {
	Geotrace,
	type GeotraceInputValue,
	type GeotraceRuntimeValue,
} from './geolocation/Geotrace.ts';
import { type IntInputValue, type IntRuntimeValue, IntValueCodec } from './IntValueCodec.ts';
import { StringValueCodec } from './StringValueCodec.ts';
import type { ValueCodec } from './ValueCodec.ts';
import { ValueTypePlaceholderCodec } from './ValueTypePlaceholderCodec.ts';

interface RuntimeValuesByType {
	readonly string: string;
	readonly int: IntRuntimeValue;
	readonly decimal: DecimalRuntimeValue;
	readonly boolean: string;
	readonly date: DatetimeRuntimeValue;
	readonly time: string;
	readonly dateTime: string;
	readonly geopoint: GeopointRuntimeValue;
	readonly geotrace: GeotraceRuntimeValue;
	readonly geoshape: GeoshapeRuntimeValue;
	readonly binary: string;
	readonly barcode: string;
	readonly intent: string;
}

export type RuntimeValue<V extends ValueType> = RuntimeValuesByType[V];

interface RuntimeInputValuesByType {
	readonly string: string;
	readonly int: IntInputValue;
	readonly decimal: DecimalInputValue;
	readonly boolean: string;
	readonly date: DatetimeInputValue;
	readonly time: string;
	readonly dateTime: string;
	readonly geopoint: GeopointInputValue;
	readonly geotrace: GeotraceInputValue;
	readonly geoshape: GeoshapeInputValue;
	readonly binary: string;
	readonly barcode: string;
	readonly intent: string;
}

export type RuntimeInputValue<V extends ValueType> = RuntimeInputValuesByType[V];

type SharedValueCodecs = {
	readonly [V in ValueType]: ValueCodec<V, RuntimeValue<V>, RuntimeInputValue<V>>;
};

export type SharedValueCodec<V extends ValueType> = SharedValueCodecs[V];

/**
 * Provides codecs for each {@link ValueType | value type}, for nodes with a
 * common representation of those value types.
 */
export const sharedValueCodecs: SharedValueCodecs = {
	string: new StringValueCodec(),

	int: new IntValueCodec(),
	decimal: new DecimalValueCodec(),
	boolean: new ValueTypePlaceholderCodec('boolean'),
	date: new DateValueCodec(),
	time: new ValueTypePlaceholderCodec('time'),
	dateTime: new ValueTypePlaceholderCodec('dateTime'),
	binary: new ValueTypePlaceholderCodec('binary'),
	barcode: new ValueTypePlaceholderCodec('barcode'),
	intent: new ValueTypePlaceholderCodec('intent'),
	geopoint: createGeolocationValueCodec<'geopoint', GeopointRuntimeValue, GeopointInputValue>(
		'geopoint',
		(value) => Geopoint.parseGeopointToString(value),
		(value) => Geopoint.parseStringToGeopoint(value)
	),
	geotrace: createGeolocationValueCodec<'geotrace', GeotraceRuntimeValue, GeotraceInputValue>(
		'geotrace',
		(value) => Geotrace.parseGeotraceString(value),
		(value) => Geotrace.parseStringToGeotrace(value)
	),
	geoshape: createGeolocationValueCodec<'geoshape', GeoshapeRuntimeValue, GeoshapeInputValue>(
		'geoshape',
		(value) => Geoshape.parseGeoshapeString(value),
		(value) => Geoshape.parseStringToGeoshape(value)
	),
};

export const getSharedValueCodec = <V extends ValueType>(valueType: V): SharedValueCodec<V> => {
	return sharedValueCodecs[valueType];
};
