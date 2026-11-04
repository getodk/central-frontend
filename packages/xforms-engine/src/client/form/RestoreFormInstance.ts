import type { ResolvableFormInstanceInput, ResolvedFormInstanceInput } from './EditFormInstance.ts';
import type { FormInstance, FormInstanceRestoreMode } from './FormInstance.ts';
import type { FormInstanceConfig } from './FormInstanceConfig.ts';

export type RestoreFormInstanceInput = ResolvableFormInstanceInput | ResolvedFormInstanceInput;

export type RestoredFormInstance = FormInstance<FormInstanceRestoreMode>;

export type RestoreFormInstance = (
  input: RestoreFormInstanceInput,
  config?: FormInstanceConfig
) => Promise<RestoredFormInstance>;
