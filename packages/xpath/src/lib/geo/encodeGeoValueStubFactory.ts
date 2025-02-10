import { EncodeGeoValueStubError } from './EncodeGeoValueStubError.ts';
import type { GeoValueEncoder, GeoValueType } from './GeoValueCodec.ts';

export const encodeValueStubFactory = <RuntimeInputValue>(
	valueType: GeoValueType
): GeoValueEncoder<RuntimeInputValue> => {
	return (_: RuntimeInputValue): string => {
		throw new EncodeGeoValueStubError(valueType);
	};
};
