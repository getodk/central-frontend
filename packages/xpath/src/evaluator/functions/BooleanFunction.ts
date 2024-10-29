import { BooleanEvaluation } from '../../evaluations/BooleanEvaluation.ts';
import type { FunctionSignature } from './FunctionImplementation.ts';
import type { TypedFunctionCallable } from './TypedFunctionImplementation.ts';
import { TypedFunctionImplementation } from './TypedFunctionImplementation.ts';

export class BooleanFunction extends TypedFunctionImplementation<boolean> {
	constructor(
		localName: string,
		signature: FunctionSignature,
		call: TypedFunctionCallable<boolean>
	) {
		super(localName, signature, call, (context, value) => {
			return new BooleanEvaluation(context, value);
		});
	}
}
