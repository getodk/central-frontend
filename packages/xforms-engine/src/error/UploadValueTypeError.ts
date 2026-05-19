import type { UploadDefinition } from '../client/UploadNode.ts';
import type { ValueType } from '../client/ValueType.ts';
import { XFormsSpecViolationError } from './XFormsSpecViolationError.ts';

type UnsupportedUploadValueType = Exclude<ValueType, 'binary'>;

export class UploadValueTypeError extends XFormsSpecViolationError {
	constructor(definition: UploadDefinition<UnsupportedUploadValueType>) {
		const { valueType } = definition;

		super(`Expected upload control to have 'binary' value type, got: ${valueType}`);
	}
}
