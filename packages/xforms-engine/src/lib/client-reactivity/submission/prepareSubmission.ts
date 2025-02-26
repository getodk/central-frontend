import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { INSTANCE_FILE_NAME, INSTANCE_FILE_TYPE } from '../../../client/constants.ts';
import type { InstanceData } from '../../../client/serialization/InstanceData.ts';
import type { InstanceFile as ClientInstanceFile } from '../../../client/serialization/InstanceFile.ts';
import type {
	ChunkedInstancePayload,
	InstancePayload,
	MonolithicInstancePayload,
} from '../../../client/serialization/InstancePayload.ts';
import type { InstancePayloadType } from '../../../client/serialization/InstancePayloadOptions.ts';
import type { SubmissionDefinition } from '../../../client/submission/SubmissionDefinition.ts';
import type { DescendantNodeViolationReference } from '../../../client/validation.ts';
import type { ClientReactiveSubmittableInstance } from '../../../instance/internal-api/submission/ClientReactiveSubmittableInstance.ts';

class InstanceFile extends File implements ClientInstanceFile {
	override readonly name = INSTANCE_FILE_NAME;
	override readonly type = INSTANCE_FILE_TYPE;

	constructor(instanceRoot: ClientReactiveSubmittableInstance) {
		const { instanceXML } = instanceRoot.instanceState;

		super([instanceXML], INSTANCE_FILE_NAME, {
			type: INSTANCE_FILE_TYPE,
		});
	}
}

type AssertSubmissionData = (data: FormData) => asserts data is InstanceData;

const assertSubmissionData: AssertSubmissionData = (data) => {
	const instanceFile = data.get(INSTANCE_FILE_NAME);

	if (!(instanceFile instanceof InstanceFile)) {
		throw new Error(`Invalid InstanceData`);
	}
};

class InstanceSubmissionData extends FormData {
	static from(instanceFile: InstanceFile, attachments: readonly File[]): InstanceData {
		const data = new this(instanceFile, attachments);

		assertSubmissionData(data);

		return data;
	}

	private constructor(
		readonly instanceFile: InstanceFile,
		readonly attachments: readonly File[]
	) {
		super();

		this.set(INSTANCE_FILE_NAME, instanceFile);

		attachments.forEach((attachment) => {
			const { name } = attachment;

			if (name === INSTANCE_FILE_NAME && attachment !== instanceFile) {
				throw new Error(`Failed to add conflicting attachment with name ${INSTANCE_FILE_NAME}`);
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

const monolithicInstancePayload = (
	validation: SubmissionInstanceStateValidation,
	definition: SubmissionDefinition,
	instanceFile: InstanceFile,
	attachments: readonly File[]
): MonolithicInstancePayload => {
	const data = InstanceSubmissionData.from(instanceFile, attachments);

	return {
		...validation,
		definition,
		data,
	};
};

interface ChunkedInstancePayloadOptions {
	readonly maxSize: number;
}

const chunkedInstancePayload = (
	validation: SubmissionInstanceStateValidation,
	definition: SubmissionDefinition,
	instanceFile: InstanceFile,
	attachments: readonly File[],
	options: ChunkedInstancePayloadOptions
): ChunkedInstancePayload => {
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

export interface PrepareSubmissionOptions<PayloadType extends InstancePayloadType> {
	readonly payloadType: PayloadType;
	readonly maxSize: number;
}

export const prepareSubmission = <PayloadType extends InstancePayloadType>(
	instanceRoot: ClientReactiveSubmittableInstance,
	options: PrepareSubmissionOptions<PayloadType>
): InstancePayload<PayloadType> => {
	const validation = validateSubmission(instanceRoot);
	const definition = instanceRoot.definition.submission;
	const instanceFile = new InstanceFile(instanceRoot);
	const attachments: readonly File[] = [];

	switch (options.payloadType) {
		case 'chunked':
			return chunkedInstancePayload(
				validation,
				definition,
				instanceFile,
				attachments,
				options
			) satisfies ChunkedInstancePayload as InstancePayload<PayloadType>;

		case 'monolithic':
			return monolithicInstancePayload(
				validation,
				definition,
				instanceFile,
				attachments
			) satisfies MonolithicInstancePayload as InstancePayload<PayloadType>;

		default:
			throw new UnreachableError(options.payloadType);
	}
};
