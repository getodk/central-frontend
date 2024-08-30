import type { AnyViolation, DescendantNodeViolationReference } from '../validation.ts';
import type { SubmissionData } from './SubmissionData.ts';
import type { SubmissionDefinition } from './SubmissionDefinition.ts';
import type { SubmissionChunkedType, SubmissionOptions } from './SubmissionOptions.ts';

// prettier-ignore
export type SubmissionResultStatus =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'pending'
	| 'max-size-exceeded'
	| 'ready';

// prettier-ignore
type SubmissionResultData<ChunkedType extends SubmissionChunkedType> = {
	chunked: readonly [SubmissionData, ...SubmissionData[]];
	monolithic: SubmissionData;
}[ChunkedType];

/**
 * Provides detail about an individual submission attachment {@link File}s which
 * exceeds the client-specified {@link maxSize} for a
 * {@link SubmissionResult<'chunked'> | chunked submission result}. Clients may
 * use this value to provide guidance to users.
 *
 * @todo We may want to consider (a) making {@link maxSize} a configuration the
 * client can provide when initializing a form instance, rather than only on
 * submission; and then (b) treating a maximum size violation as another kind of
 * node-level violation. This would go beyond the kinds of validation specified
 * by ODK XForms, but it would make a lot of _conceptual sense_.
 *
 * It would almost certainly be helpful to alert users to violations as the
 * occur, rather than only at submission time (where they have likely already
 * moved on). This is something clients can do without engine support, but it
 * would likely promote good usability patterns if the engine makes it an
 * obvious and uniform option at the main engine/client entrypoint.
 *
 * @todo If we consider the above, we'd want to reframe _this interface_ to
 * match the shape of other {@link AnyViolation | violations} (adding it as a
 * member of that union). We'd also likely eliminate
 * {@link MaxSizeExceededResult} in the process, since
 * {@link PendingSubmissionResult} would then cover the case.
 */
interface MaxSizeViolation {
	/**
	 * Specifies the index of
	 * {@link SubmissionResultData<'chunked'> | chunked submission data} where a
	 * submission attachment {@link File} exceeds the client-specified
	 * {@link maxSize}.
	 */
	readonly dataIndex: number;

	/**
	 * Specifies the name of the file which exceeds the client-specified
	 * {@link maxSize}. This name can also be used as a key to access the
	 * violating {@link File}/submission attachment, in the {@link SubmissionData}
	 * at the specified {@link dataIndex}.
	 */
	readonly fileName: string;

	/**
	 * Reflects the client-specified maximum size for each chunk of a
	 * {@link SubmissionResult<'chunked'> | chunked submission result}.
	 */
	readonly maxSize: number;

	/**
	 * Details the actual size of the violating {@link File}/submission
	 * attachment. Along with {@link maxSize}. Clients may use the delta between
	 * this value and {@link maxSize} to provide detailed guidance to users.
	 */
	readonly actualSize: number;
}

// prettier-ignore
type SubmissionResultViolation =
	| DescendantNodeViolationReference
	| MaxSizeViolation;

interface BaseSubmissionResult<ChunkedType extends SubmissionChunkedType> {
	readonly status: SubmissionResultStatus;
	readonly definition: SubmissionDefinition;
	get violations(): readonly SubmissionResultViolation[] | null;

	/**
	 * Submission data may be chunked according to the
	 * {@link SubmissionOptions.maxSize | maxSize submission option}
	 */
	readonly data: SubmissionResultData<ChunkedType>;
}

interface PendingSubmissionResult<ChunkedType extends SubmissionChunkedType>
	extends BaseSubmissionResult<ChunkedType> {
	readonly status: 'pending';
	get violations(): readonly DescendantNodeViolationReference[];
}

interface MaxSizeExceededResult extends BaseSubmissionResult<'chunked'> {
	readonly status: 'max-size-exceeded';
	get violations(): readonly MaxSizeViolation[];
}

interface ReadySubmissionResult<ChunkedType extends SubmissionChunkedType>
	extends BaseSubmissionResult<ChunkedType> {
	readonly status: 'ready';
	get violations(): null;
}

// prettier-ignore
type CommonSubmissionResult<ChunkedType extends SubmissionChunkedType> =
	| PendingSubmissionResult<ChunkedType>
	| ReadySubmissionResult<ChunkedType>;

// prettier-ignore
export type ChunkedSubmissionResult =
	| CommonSubmissionResult<'chunked'>
	| MaxSizeExceededResult;

export type MonolithicSubmissionResult = CommonSubmissionResult<'monolithic'>;

// prettier-ignore
export type SubmissionResult<ChunkedType extends SubmissionChunkedType> = {
	chunked: ChunkedSubmissionResult;
	monolithic: MonolithicSubmissionResult;
}[ChunkedType];
