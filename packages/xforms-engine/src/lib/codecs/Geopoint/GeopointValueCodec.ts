import { type CodecDecoder, type CodecEncoder, ValueCodec } from '../ValueCodec.ts';
import { Geopoint, type GeopointInputValue, type GeopointRuntimeValue } from './Geopoint.ts';

export class GeopointValueCodec extends ValueCodec<
	'geopoint',
	GeopointRuntimeValue,
	GeopointInputValue
> {
	constructor() {
		const encodeValue: CodecEncoder<GeopointInputValue> = (value) => {
			return Geopoint.toCoordinatesString(value);
		};

		const decodeValue: CodecDecoder<GeopointRuntimeValue> = (value: string) => {
			return Geopoint.parseString(value);
		};

		super('geopoint', encodeValue, decodeValue);
	}
}
