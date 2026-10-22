import type { InstanceData } from '../serialization/InstanceData.ts';
import type { EditFormInstanceInput } from './EditFormInstance.ts';
import type { FormInstance, FormInstanceRestoreMode } from './FormInstance.ts';
import type { FormInstanceConfig } from './FormInstanceConfig.ts';

export interface RestoreFormInstanceInput {
  readonly data: readonly [InstanceData, ...InstanceData[]];
}

export type RestoredFormInstance = FormInstance<FormInstanceRestoreMode>;

export type RestoreFormInstance = (
  input: EditFormInstanceInput,
  config?: FormInstanceConfig
) => Promise<RestoredFormInstance>;
