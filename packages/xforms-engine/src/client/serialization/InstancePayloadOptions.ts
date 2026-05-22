export type InstancePayloadType = 'chunked' | 'monolithic';

interface BaseInstancePayloadOptions<PayloadType extends InstancePayloadType> {
	readonly payloadType: PayloadType;

	/**
	 * As described in the
	 * {@link https://docs.getodk.org/openrosa-form-submission/#extended-transmission-considerations | OpenRosa Form Submission API},
	 * clients may obtain this value from an OpenRosa server's
	 * `X-OpenRosa-Accept-Content-Length` header.
	 */
	readonly maxSize?: number;
}

interface ChunkedInstancePayloadOptions extends BaseInstancePayloadOptions<'chunked'> {
	readonly payloadType: 'chunked';
	readonly maxSize: number;
}

interface MonolithicInstancePayloadOptions extends BaseInstancePayloadOptions<'monolithic'> {
	readonly payloadType: 'monolithic';
	readonly maxSize?: never;
}

// prettier-ignore
export type InstancePayloadOptions<PayloadType extends InstancePayloadType = 'monolithic'> = {
	chunked: ChunkedInstancePayloadOptions;
	monolithic: MonolithicInstancePayloadOptions;
}[PayloadType];
