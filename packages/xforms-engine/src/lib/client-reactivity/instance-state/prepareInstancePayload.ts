import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { bestFitDecreasing } from 'bin-packer';
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
import { ErrorProductionDesignPendingError } from '../../../error/ErrorProductionDesignPendingError.ts';
import type { InstanceAttachmentsState } from '../../../instance/attachments/InstanceAttachmentsState.ts';
import type { ClientReactiveSerializableInstance } from '../../../instance/internal-api/serialization/ClientReactiveSerializableInstance.ts';

const collectInstanceAttachmentFiles = (attachments: InstanceAttachmentsState): readonly File[] => {
	const files = Array.from(attachments.entries()).map(([context, attachment]) => {
		if (!context.isAttached() || !context.isRelevant()) {
			return null;
		}

		return attachment.getValue();
	});

	return files.filter((file) => file != null);
};

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

type AssertFile = (value: FormDataEntryValue) => asserts value is File;

const assertFile: AssertFile = (value) => {
	if (!(value instanceof File)) {
		throw new ErrorProductionDesignPendingError('Expected an instance of File');
	}
};

type AssertInstanceData = (data: FormData) => asserts data is ClientInstanceData;

const assertInstanceData: AssertInstanceData = (data) => {
	let instanceFile: File | null = null;

	for (const [key, value] of data.entries()) {
		assertFile(value);

		if (key === INSTANCE_FILE_NAME) {
			instanceFile = value;
		}
	}

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
		payloadType: 'monolithic',
		...validation,
		submissionMeta,
		data: [data],
	};
};

interface ChunkedInstancePayloadOptions {
	readonly maxSize: number;
}

type PartitionedInstanceData = readonly [ClientInstanceData, ...ClientInstanceData[]];

const partitionInstanceData = (
	instanceFile: InstanceFile,
	attachments: readonly File[],
	options: ChunkedInstancePayloadOptions
): PartitionedInstanceData => {
	const { maxSize } = options;
	const maxAttachmentSize = maxSize - instanceFile.size;
	const { bins, oversized } = bestFitDecreasing(
		attachments,
		(attachment) => {
			return attachment.size;
		},
		maxAttachmentSize
	);

	const errors = oversized.map((attachment) => {
		return new Error(
			`Combined size of instance XML (${instanceFile.size}) and attachment (${attachment.size}) exceeds maxSize (${maxSize}).`
		);
	});

	if (errors.length > 0) {
		throw new AggregateError(errors, 'Failed to produce chunked instance payload');
	}

	const [
		// Ensure at least one `InstanceData` is produced, in case there are no
		// attachments present at all
		head = InstanceData.from(instanceFile, []),
		...tail
	] = bins.map((bin) => InstanceData.from(instanceFile, bin));

	return [head, ...tail];
};

const chunkedInstancePayload = (
	validation: InstanceStateValidation,
	submissionMeta: SubmissionMeta,
	instanceFile: InstanceFile,
	attachments: readonly File[],
	options: ChunkedInstancePayloadOptions
): ChunkedInstancePayload => {
	const data = partitionInstanceData(instanceFile, attachments, options);

	return {
		payloadType: 'chunked',
		...validation,
		submissionMeta,
		data,
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
	const attachments = collectInstanceAttachmentFiles(instanceRoot.attachments);

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
