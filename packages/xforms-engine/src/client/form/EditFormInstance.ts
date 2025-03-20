import type { Awaitable, Thunk } from '@getodk/common/types/helpers.d.ts';
import type { FetchResourceResponse } from '../resources.ts';
import type { InstanceAttachmentFileName, InstanceData } from '../serialization/InstanceData.ts';
import type { FormInstance, FormInstanceEditMode } from './FormInstance.ts';
import type { FormInstanceConfig } from './FormInstanceConfig.ts';
import type { LoadForm } from './LoadForm.ts';
import type { RestoreFormInstance, RestoreFormInstanceInput } from './RestoreFormInstance.ts';

export type ResolvableFormInstanceInputType = 'FORM_INSTANCE_INPUT_RESOLVABLE';
export type ResolvedFormInstanceInputType = 'FORM_INSTANCE_INPUT_RESOLVED';

// prettier-ignore
export type EditFormInstanceInputType =
	| ResolvableFormInstanceInputType
	| ResolvedFormInstanceInputType;

// prettier-ignore
export type ResolvedFormInstance =
	| Blob
	| FetchResourceResponse
	| File
	| string;

export type ResolvableFormInstance = Thunk<Awaitable<ResolvedFormInstance>>;

export type ResolveFormInstanceResource = Thunk<Promise<FetchResourceResponse>>;

export type ResolvableInstanceAttachmentsMap = ReadonlyMap<
	InstanceAttachmentFileName,
	ResolveFormInstanceResource
>;

interface BaseEditFormInstanceInput {
	readonly inputType: EditFormInstanceInputType;
	readonly data?: readonly [InstanceData, ...InstanceData[]];
	readonly resolveInstance?: ResolvableFormInstance;
	readonly attachments?: ResolvableInstanceAttachmentsMap;
}

export interface ResolvableFormInstanceInput extends BaseEditFormInstanceInput {
	readonly inputType: ResolvableFormInstanceInputType;
	readonly resolveInstance: ResolvableFormInstance;
	readonly attachments: ResolvableInstanceAttachmentsMap;
	readonly data?: never;
}

/**
 * @todo This is included as a strawman for discussiong: "should we accept input
 * to {@link EditFormInstance} in the same shape as input to
 * {@link RestoreFormInstance}?".
 *
 * Pros:
 *
 * - More consistency between the two entrypoint APIs, which are pretty similar
 *   _conceptually_.
 * - ?
 *
 * Cons:
 *
 * - Less consistency between this entrypoint API and {@link LoadForm}, which is
 *   also responsible for loading arbitrary attachments (presumably over a
 *   network), which...
 * - ... all but rules out flexibility to optimize loading large resources (i.e.
 *   streaming video/audio)
 *
 * Alternative:
 *
 * - Increase consistency across the board by inverting the relationship between
 *   edit/restore: {@link RestoreFormInstanceInput} could be the place where we
 *   accept a union of resolved | resolvable input, and clients which might
 *   benefit from this consistency could consolidate on the resolvable case
 *   without sacrificing resource loading optimizations)
 */
export interface ResolvedFormInstanceInput
	extends BaseEditFormInstanceInput,
		RestoreFormInstanceInput {
	readonly inputType: ResolvedFormInstanceInputType;
	readonly data: readonly [InstanceData, ...InstanceData[]];
	readonly resolveInstance?: never;
	readonly attachments?: never;
}

// prettier-ignore
export type EditFormInstanceInput =
	| ResolvableFormInstanceInput
	| ResolvedFormInstanceInput;

export type EditedFormInstance = FormInstance<FormInstanceEditMode>;

export type EditFormInstance = (
	input: EditFormInstanceInput,
	config?: FormInstanceConfig
) => Promise<EditedFormInstance>;
