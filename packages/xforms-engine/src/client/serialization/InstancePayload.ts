import type { SubmissionMeta } from '../submission/SubmissionMeta.ts';
import type { AnyViolation, DescendantNodeViolationReference } from '../validation.ts';
import type { InstanceData } from './InstanceData.ts';
import type { InstancePayloadOptions, InstancePayloadType } from './InstancePayloadOptions.ts';

// prettier-ignore
export type InstancePayloadStatus =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'pending'
	| 'max-size-exceeded'
	| 'ready';

// prettier-ignore
type InstancePayloadData<PayloadType extends InstancePayloadType> = {
	chunked: readonly [InstanceData, ...InstanceData[]];
	monolithic: readonly [InstanceData];
}[PayloadType];

/**
 * Provides detail about an individual instance attachment {@link File}s which
 * exceeds the client-specified {@link maxSize} for a
 * {@link ChunkedInstancePayload | chunked instance payload}. Clients may use
 * this value to provide guidance to users.
 *
 * @todo We may want to consider (a) making {@link maxSize} a configuration the
 * client can provide when initializing a form instance, rather than only when
 * serializing an instance payload; and then (b) treating a maximum size
 * violation as another kind of node-level violation. This would go beyond the
 * kinds of validation specified by ODK XForms, but it would make a lot of
 * _conceptual sense_.
 *
 * It would almost certainly be helpful to alert users to violations as the
 * occur, rather than only at instance payload serialization time (where they
 * have likely already moved on). This is something clients can do without
 * engine support, but it would likely promote good usability patterns if the
 * engine makes it an obvious and uniform option at the main engine/client
 * entrypoint.
 *
 * @todo If we consider the above, we'd want to reframe _this interface_ to
 * match the shape of other {@link AnyViolation | violations} (adding it as a
 * member of that union). We'd also likely eliminate
 * {@link MaxSizeExceededResult} in the process, since
 * {@link PendingInstancePayload} would then cover the case.
 */
interface MaxSizeViolation {
	/**
	 * Specifies the index of
	 * {@link InstancePayloadData<'chunked'> | chunked instance payload data}
	 * where an instance attachment {@link File} exceeds the client-specified
	 * {@link maxSize}.
	 */
	readonly dataIndex: number;

	/**
	 * Specifies the name of the file which exceeds the client-specified
	 * {@link maxSize}. This name can also be used as a key to access the
	 * violating {@link File}/instance attachment, in the {@link InstanceData} at
	 * the specified {@link dataIndex}.
	 */
	readonly fileName: string;

	/**
	 * Reflects the client-specified maximum size for each chunk of a
	 * {@link ChunkedInstancePayload | chunked instance payload}.
	 */
	readonly maxSize: number;

	/**
	 * Details the actual size of the violating {@link File}/instance attachment.
	 * Along with {@link maxSize}. Clients may use the delta between this value
	 * and {@link maxSize} to provide detailed guidance to users.
	 */
	readonly actualSize: number;
}

// prettier-ignore
type InstancePayloadViolation =
	| DescendantNodeViolationReference
	| MaxSizeViolation;

interface BaseInstancePayload<PayloadType extends InstancePayloadType> {
	readonly payloadType: PayloadType;
	readonly status: InstancePayloadStatus;
	readonly submissionMeta: SubmissionMeta;

	get violations(): readonly InstancePayloadViolation[] | null;

	/**
	 * Instance attachment data may be chunked according to the
	 * {@link InstancePayloadOptions.maxSize | maxSize instance payload option}
	 */
	readonly data: InstancePayloadData<PayloadType>;
}

interface PendingInstancePayload<PayloadType extends InstancePayloadType>
	extends BaseInstancePayload<PayloadType> {
	readonly status: 'pending';
	get violations(): readonly DescendantNodeViolationReference[];
}

interface MaxSizeExceededResult extends BaseInstancePayload<'chunked'> {
	readonly status: 'max-size-exceeded';
	get violations(): readonly MaxSizeViolation[];
}

interface ReadyInstancePayload<PayloadType extends InstancePayloadType>
	extends BaseInstancePayload<PayloadType> {
	readonly status: 'ready';
	get violations(): null;
}

// prettier-ignore
export type ChunkedInstancePayload =
	| MaxSizeExceededResult
	| PendingInstancePayload<'chunked'>
	| ReadyInstancePayload<'chunked'>;

export type MonolithicInstancePayload =
	| PendingInstancePayload<'monolithic'>
	| ReadyInstancePayload<'monolithic'>;

// prettier-ignore
export type InstancePayload<PayloadType extends InstancePayloadType> = {
	chunked: ChunkedInstancePayload;
	monolithic: MonolithicInstancePayload;
}[PayloadType];
