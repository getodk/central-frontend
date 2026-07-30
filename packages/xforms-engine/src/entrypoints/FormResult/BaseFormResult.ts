import type {
  FormResultStatus,
  LoadFormFailureResult,
  LoadFormResult,
  LoadFormSuccessResult,
  LoadFormWarningResult,
} from '../../client/form/LoadFormResult.ts';
import type { SecondaryInstancesDefinition } from '../../parse/model/SecondaryInstance/SecondaryInstancesDefinition.ts';

interface LoadFormResultByStatus {
  readonly success: LoadFormSuccessResult;
  readonly warning: LoadFormWarningResult;
  readonly failure: LoadFormFailureResult;
}

export type BaseFormResultProperty<
  Status extends FormResultStatus,
  Key extends keyof LoadFormResult,
> = LoadFormResultByStatus[Status][Key];

export interface BaseFormResultOptions<Status extends FormResultStatus> {
  readonly status: Status;
  readonly warnings: BaseFormResultProperty<Status, 'warnings'>;
  readonly error: BaseFormResultProperty<Status, 'error'>;
  readonly secondaryInstances: SecondaryInstancesDefinition;
}

export abstract class BaseFormResult<Status extends FormResultStatus> {
  readonly status: Status;
  readonly warnings: BaseFormResultProperty<Status, 'warnings'>;
  readonly error: BaseFormResultProperty<Status, 'error'>;
  readonly secondaryInstances: SecondaryInstancesDefinition;

  abstract readonly createInstance: BaseFormResultProperty<Status, 'createInstance'>;
  abstract readonly resetInstance: BaseFormResultProperty<Status, 'resetInstance'>;
  abstract readonly editInstance: BaseFormResultProperty<Status, 'editInstance'>;
  abstract readonly restoreInstance: BaseFormResultProperty<Status, 'restoreInstance'>;

  constructor(options: BaseFormResultOptions<Status>) {
    this.status = options.status;
    this.warnings = options.warnings;
    this.error = options.error;
    this.secondaryInstances = options.secondaryInstances;
  }
}
