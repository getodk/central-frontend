import type { SelectDefinition } from '../client/SelectNode.ts';
import type { UnsupportedBaseItemValueType } from '../lib/codecs/items/BaseItemCodec.ts';
import { XFormsSpecViolationError } from './XFormsSpecViolationError.ts';

/**
 * @todo It would be good to have a standardized way to use specific types of
 * errors as a prompt for feedback. There is currently a feedback link presented
 * by `@getodk/web-forms`, which is conditionally displayed (condition is
 * evidently controlled by a
 * {@link https://vuejs.org/api/sfc-script-setup#defineoptions | Vue component option}).
 *
 * @see {@link https://github.com/getodk/web-forms/issues/276}
 */
export class SelectValueTypeError extends XFormsSpecViolationError {
	constructor(definition: SelectDefinition<UnsupportedBaseItemValueType>) {
		const { valueType } = definition;

		super(
			`Selects of type ${valueType} are not currently supported. If this functionality would be useful for your form, your feedback is welcome!`
		);
	}
}
