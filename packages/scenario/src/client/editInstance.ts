import { getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import { buildFileResponse } from '@getodk/common/lib/web-compat/response.ts';
import type {
	EditedFormInstance,
	InstancePayload,
	ResolvableFormInstanceInput,
	ResolvableInstanceAttachmentsMap,
	ResolveFormInstanceResource,
	RootNode,
} from '@getodk/xforms-engine';
import { constants as ENGINE_CONSTANTS } from '@getodk/xforms-engine';
import { assert, expect } from 'vitest';
import type { InitializableForm } from './init.ts';

/**
 * @todo This type should probably:
 *
 * - Be exported from the engine
 * - With a name like this
 * - With the `status` enum updated to replace "ready" with "submittable"
 *
 * Doing so is deferred for now, to avoid a late breaking change to the engine's
 * client interface which will also affect integrating host applications (e.g.
 * Central, whose release is blocked awaiting edit functionality).
 *
 * Similarly, exporting a type of the same name with the existing "ready" enum
 * value is deferred for now to avoid a confusing mismatch between names.
 */
type SubmittableInstancePayload = Extract<
	InstancePayload<'monolithic'>,
	{ readonly status: 'ready' }
>;

type AssertSubmittable = (
	payload: InstancePayload<'monolithic'>
) => asserts payload is SubmittableInstancePayload;

/**
 * @todo Can Vitest assertion extensions do this type refinement directly?
 * Normally we'd use {@link assert} for this, but we already have
 * `toBeReadyForSubmission`, with much clearer intent and semantics.
 */
const assertSubmittable: AssertSubmittable = (payload) => {
	expect(payload).toBeReadyForSubmission();
};

const mockSubmissionIO = (payload: SubmittableInstancePayload): ResolvableFormInstanceInput => {
	const instanceFile = payload.data[0].get(ENGINE_CONSTANTS.INSTANCE_FILE_NAME);
	const resolveInstance = () => getBlobText(instanceFile);
	const attachmentFiles = Array.from(payload.data)
		.flatMap((data) => Array.from(data.values()))
		.filter((value): value is File => value !== instanceFile && value instanceof File);
	const attachments: ResolvableInstanceAttachmentsMap = new Map(
		attachmentFiles.map((file) => {
			const resolveAttachment: ResolveFormInstanceResource = async () => {
				return buildFileResponse(file);
			};

			return [file.name, resolveAttachment];
		})
	);

	return {
		inputType: 'FORM_INSTANCE_INPUT_RESOLVABLE',
		resolveInstance,
		attachments,
	};
};

/**
 * Creates a new {@link EditedFormInstance} from an existing
 * {@link instanceRoot}:
 *
 * 1. Prepare an {@link InstancePayload | instance payload} from the existing
 *    instance
 * 2. Assert that the payload is
 *    {@link SubmittableInstancePayload | submittable}
 * 3. Wrap the payload's data to satisfy the {@link ResolvableFormInstanceInput}
 *    interface (effectively {@link mockSubmissionIO | mocking submission I/O})
 * 4. Create an {@link EditedFormInstance} from that I/O-mocked input
 */
export const editInstance = async (
	form: InitializableForm,
	instanceRoot: RootNode
): Promise<EditedFormInstance> => {
	const payload = await instanceRoot.prepareInstancePayload();

	assertSubmittable(payload);

	return form.editInstance(mockSubmissionIO(payload));
};
