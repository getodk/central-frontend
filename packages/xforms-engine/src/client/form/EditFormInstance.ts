import type { Awaitable, Thunk } from '@getodk/common/types/helpers.d.ts';
import type { FetchResourceResponse } from '../resources.ts';
import type { InstanceAttachmentFileName, InstanceData } from '../serialization/InstanceData.ts';
import type { FormInstance, FormInstanceEditMode } from './FormInstance.ts';
import type { FormInstanceConfig } from './FormInstanceConfig.ts';

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

interface BaseFormInstanceInput {
  readonly inputType: EditFormInstanceInputType;
  readonly data?: readonly [InstanceData, ...InstanceData[]];
  readonly resolveInstance?: ResolvableFormInstance;
  readonly attachments?: ResolvableInstanceAttachmentsMap;
}

export interface ResolvableFormInstanceInput extends BaseFormInstanceInput {
  readonly inputType: ResolvableFormInstanceInputType;
  readonly resolveInstance: ResolvableFormInstance;
  readonly attachments: ResolvableInstanceAttachmentsMap;
  readonly data?: never;
}

export interface ResolvedFormInstanceInput extends BaseFormInstanceInput {
  readonly inputType: ResolvedFormInstanceInputType;
  readonly data: readonly [InstanceData, ...InstanceData[]];
  readonly resolveInstance?: never;
  readonly attachments?: never;
}

// TODO rename so it can be used for both edit and restore?
// prettier-ignore
export type EditFormInstanceInput =
	| ResolvableFormInstanceInput
	| ResolvedFormInstanceInput;

export type EditedFormInstance = FormInstance<FormInstanceEditMode>;

export type EditFormInstance = (
  input: EditFormInstanceInput,
  config?: FormInstanceConfig
) => Promise<EditedFormInstance>;
