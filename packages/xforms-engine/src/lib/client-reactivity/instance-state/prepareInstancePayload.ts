import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { INSTANCE_FILE_NAME, INSTANCE_FILE_TYPE } from '../../../client/constants.ts';
import type { InstanceData as ClientInstanceData } from '../../../client/serialization/InstanceData.ts';
import type { InstanceFile as ClientInstanceFile } from '../../../client/serialization/InstanceFile.ts';
import type {
	ChunkedInstancePayload,
	InstancePayload,
	MonolithicInstancePayload,
} from '../../../client/serialization/InstancePayload.ts';
import type { InstancePayloadType } from '../../../client/serialization/InstancePayloadOptions.ts';
import type { SubmissionMeta } from '../../../client/submission/SubmissionMeta.ts';
import type { DescendantNodeViolationReference } from '../../../client/validation.ts';
import type { ClientReactiveSerializableInstance } from '../../../instance/internal-api/serialization/ClientReactiveSerializableInstance.ts';

class InstanceFile extends File implements ClientInstanceFile {
	override readonly name = INSTANCE_FILE_NAME;
	override readonly type = INSTANCE_FILE_TYPE;

	constructor(instanceRoot: ClientReactiveSerializableInstance) {
		const { instanceXML } = instanceRoot.instanceState;

		super([instanceXML], INSTANCE_FILE_NAME, {
			type: INSTANCE_FILE_TYPE,
		});
	}
}

type AssertInstanceData = (data: FormData) => asserts data is ClientInstanceData;

const assertInstanceData: AssertInstanceData = (data) => {
	const instanceFile = data.get(INSTANCE_FILE_NAME);

	if (!(instanceFile instanceof InstanceFile)) {
		throw new Error(`Invalid InstanceData`);
	}
};

class InstanceData extends FormData {
	static from(instanceFile: InstanceFile, attachments: readonly File[]): ClientInstanceData {
		const data = new this(instanceFile, attachments);

		assertInstanceData(data);

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

type InstanceStateValidation = PendingValidation | ReadyValidation;

const validateInstance = (
	instanceRoot: ClientReactiveSerializableInstance
): InstanceStateValidation => {
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
	validation: InstanceStateValidation,
	submissionMeta: SubmissionMeta,
	instanceFile: InstanceFile,
	attachments: readonly File[]
): MonolithicInstancePayload => {
	const data = InstanceData.from(instanceFile, attachments);

	return {
		...validation,
		submissionMeta,
		data: [data],
	};
};

interface ChunkedInstancePayloadOptions {
	readonly maxSize: number;
}

const chunkedInstancePayload = (
	validation: InstanceStateValidation,
	submissionMeta: SubmissionMeta,
	instanceFile: InstanceFile,
	attachments: readonly File[],
	options: ChunkedInstancePayloadOptions
): ChunkedInstancePayload => {
	if (attachments.length > 0 || options.maxSize !== Infinity) {
		throw new Error('InstancePayload chunking pending implementation');
	}

	const data = InstanceData.from(instanceFile, attachments);

	return {
		...validation,
		submissionMeta,
		data: [data],
	};
};

export interface PrepareInstancePayloadOptions<PayloadType extends InstancePayloadType> {
	readonly payloadType: PayloadType;
	readonly maxSize: number;
}

export const prepareInstancePayload = <PayloadType extends InstancePayloadType>(
	instanceRoot: ClientReactiveSerializableInstance,
	options: PrepareInstancePayloadOptions<PayloadType>
): InstancePayload<PayloadType> => {
	const validation = validateInstance(instanceRoot);
	const submissionMeta = instanceRoot.definition.submission;
	const instanceFile = new InstanceFile(instanceRoot);
	const attachments: readonly File[] = [];

	switch (options.payloadType) {
		case 'chunked':
			return chunkedInstancePayload(
				validation,
				submissionMeta,
				instanceFile,
				attachments,
				options
			) satisfies ChunkedInstancePayload as InstancePayload<PayloadType>;

		case 'monolithic':
			return monolithicInstancePayload(
				validation,
				submissionMeta,
				instanceFile,
				attachments
			) satisfies MonolithicInstancePayload as InstancePayload<PayloadType>;

		default:
			throw new UnreachableError(options.payloadType);
	}
};
