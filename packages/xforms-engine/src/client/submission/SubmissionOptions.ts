export type SubmissionChunkedType = 'chunked' | 'monolithic';

interface BaseSubmissionOptions<ChunkedType extends SubmissionChunkedType> {
	readonly chunked?: ChunkedType | undefined;

	/**
	 * As described in the
	 * {@link https://docs.getodk.org/openrosa-form-submission/#extended-transmission-considerations | OpenRosa Form Submission API},
	 * clients may obtain this value from an OpenRosa server's
	 * `X-OpenRosa-Accept-Content-Length` header.
	 */
	readonly maxSize?: number;
}

interface ChunkedSubmissionOptions extends BaseSubmissionOptions<'chunked'> {
	readonly maxSize: number;
}

interface MonolithicSubmissionOptions extends BaseSubmissionOptions<'monolithic'> {
	readonly chunked?: 'monolithic' | undefined;
	readonly maxSize?: never;
}

// prettier-ignore
export type SubmissionOptions<ChunkedType extends SubmissionChunkedType = 'monolithic'> = {
	chunked: ChunkedSubmissionOptions;
	monolithic: MonolithicSubmissionOptions;
}[ChunkedType];
