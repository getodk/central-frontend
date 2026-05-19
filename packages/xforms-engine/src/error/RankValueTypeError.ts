import { XFormsSpecViolationError } from './XFormsSpecViolationError.ts';
import type { RankDefinition } from '../client/RankNode.ts';
import type { UnsupportedBaseItemValueType } from '../lib/codecs/items/BaseItemCodec.ts';

export class RankValueTypeError extends XFormsSpecViolationError {
	constructor(definition: RankDefinition<UnsupportedBaseItemValueType>) {
		const { valueType } = definition;

		super(
			`Ranks of type ${valueType} are not currently supported. If this functionality would be useful for your form, your feedback is welcome!`
		);
	}
}
