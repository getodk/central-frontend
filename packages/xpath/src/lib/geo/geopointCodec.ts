import { encodeValueStubFactory } from './encodeGeoValueStubFactory.ts';
import { Geopoint } from './Geopoint.ts';
import type { GeoValueCodec } from './GeoValueCodec.ts';

export const geopointCodec: GeoValueCodec<'geopoint', Geopoint> = {
	valueType: 'geopoint',
	encodeValue: encodeValueStubFactory('geopoint'),
	decodeValue: (value) => {
		return Geopoint.fromNodeValue(value);
	},
};
