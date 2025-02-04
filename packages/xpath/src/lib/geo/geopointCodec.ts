import { encodeValueStubFactory } from './encodeGeoValueStubFactory.ts';
import { Geopoint } from './Geopoint.ts';
import type { GeoValueCodec } from './GeoValueCodec.ts';

export type GeopointRuntimeValue = Geopoint | null;

export const geopointCodec: GeoValueCodec<'geopoint', GeopointRuntimeValue> = {
	valueType: 'geopoint',
	encodeValue: encodeValueStubFactory('geopoint'),
	decodeValue: (value) => {
		return Geopoint.fromNodeValue(value);
	},
};
