import type { GeoValueType } from './GeoValueCodec.ts';

export class EncodeGeoValueStubError extends Error {
	constructor(valueType: GeoValueType) {
		super(`Encoding "${valueType}" values is not implemented here.`);
	}
}
