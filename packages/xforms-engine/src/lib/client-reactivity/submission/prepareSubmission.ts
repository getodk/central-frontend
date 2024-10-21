import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import {
	SUBMISSION_INSTANCE_FILE_NAME,
	SUBMISSION_INSTANCE_FILE_TYPE,
} from '../../../client/constants.ts';
import type { SubmissionData } from '../../../client/submission/SubmissionData.ts';
import type { SubmissionDefinition } from '../../../client/submission/SubmissionDefinition.ts';
import type { SubmissionInstanceFile } from '../../../client/submission/SubmissionInstanceFile.ts';
import type { SubmissionChunkedType } from '../../../client/submission/SubmissionOptions.ts';
import type { SubmissionResult } from '../../../client/submission/SubmissionResult.ts';
import type { DescendantNodeViolationReference } from '../../../client/validation.ts';
import type { ClientReactiveSubmittableInstance } from '../../../instance/internal-api/submission/ClientReactiveSubmittableInstance.ts';

class InstanceFile extends File implements SubmissionInstanceFile {
	override readonly name = SUBMISSION_INSTANCE_FILE_NAME;
	override readonly type = SUBMISSION_INSTANCE_FILE_TYPE;

	constructor(instanceRoot: ClientReactiveSubmittableInstance) {
		const { submissionXML } = instanceRoot.submissionState;

		super([submissionXML], SUBMISSION_INSTANCE_FILE_NAME, {
			type: SUBMISSION_INSTANCE_FILE_TYPE,
		});
	}
}

type AssertSubmissionData = (data: FormData) => asserts data is SubmissionData;

const assertSubmissionData: AssertSubmissionData = (data) => {
	const instanceFile = data.get(SUBMISSION_INSTANCE_FILE_NAME);

	if (!(instanceFile instanceof InstanceFile)) {
		throw new Error(`Invalid SubmissionData`);
	}
};

class InstanceSubmissionData extends FormData {
	static from(instanceFile: InstanceFile, attachments: readonly File[]): SubmissionData {
		const data = new this(instanceFile, attachments);

		assertSubmissionData(data);

		return data;
	}

	private constructor(
		readonly instanceFile: InstanceFile,
		readonly attachments: readonly File[]
	) {
		super();

		this.set(SUBMISSION_INSTANCE_FILE_NAME, instanceFile);

		attachments.forEach((attachment) => {
			const { name } = attachment;

			if (name === SUBMISSION_INSTANCE_FILE_NAME && attachment !== instanceFile) {
				throw new Error(
					`Failed to add conflicting attachment with name ${SUBMISSION_INSTANCE_FILE_NAME}`
				);
			}

			this.set(name, attachment);
		});
	}
}

interface PendingValidation {
	readonly status: 'pending';
	readonly violations: readonly DescendantNodeViolationReference[];
}

interface ReadyValidation {
	readonly status: 'ready';
	readonly violations: null;
}

type SubmissionInstanceStateValidation = PendingValidation | ReadyValidation;

const validateSubmission = (
	instanceRoot: ClientReactiveSubmittableInstance
): SubmissionInstanceStateValidation => {
	const { violations } = instanceRoot.validationState;

	if (violations.length === 0) {
		return {
			status: 'ready',
			violations: null,
		};
	}

	return {
		status: 'pending',
		violations,
	};
};

const monolithicSubmissionResult = (
	validation: SubmissionInstanceStateValidation,
	definition: SubmissionDefinition,
	instanceFile: InstanceFile,
	attachments: readonly File[]
): SubmissionResult<'monolithic'> => {
	const data = InstanceSubmissionData.from(instanceFile, attachments);

	return {
		...validation,
		definition,
		data,
	};
};

interface ChunkedSubmissionResultOptions {
	readonly maxSize: number;
}

const chunkedSubmissionResult = (
	validation: SubmissionInstanceStateValidation,
	definition: SubmissionDefinition,
	instanceFile: InstanceFile,
	attachments: readonly File[],
	options: ChunkedSubmissionResultOptions
): SubmissionResult<'chunked'> => {
	if (attachments.length > 0 || options.maxSize !== Infinity) {
		throw new Error('Submission chunking pending implementation');
	}

	const data = InstanceSubmissionData.from(instanceFile, attachments);

	return {
		...validation,
		definition,
		data: [data],
	};
};

export interface PrepeareSubmissionOptions<ChunkedType extends SubmissionChunkedType> {
	readonly chunked: ChunkedType;
	readonly maxSize: number;
}

export const prepareSubmission = <ChunkedType extends SubmissionChunkedType>(
	instanceRoot: ClientReactiveSubmittableInstance,
	options: PrepeareSubmissionOptions<ChunkedType>
): SubmissionResult<ChunkedType> => {
	const validation = validateSubmission(instanceRoot);
	const definition = instanceRoot.definition.submission;
	const instanceFile = new InstanceFile(instanceRoot);
	const attachments: readonly File[] = [];

	switch (options.chunked) {
		case 'chunked':
			return chunkedSubmissionResult(
				validation,
				definition,
				instanceFile,
				attachments,
				options
			) satisfies SubmissionResult<'chunked'> as SubmissionResult<ChunkedType>;

		case 'monolithic':
			return monolithicSubmissionResult(
				validation,
				definition,
				instanceFile,
				attachments
			) satisfies SubmissionResult<'monolithic'> as SubmissionResult<ChunkedType>;

		default:
			throw new UnreachableError(options.chunked);
	}
};
