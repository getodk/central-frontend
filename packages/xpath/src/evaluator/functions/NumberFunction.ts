import { NumberEvaluation } from '../../evaluations/NumberEvaluation.ts';
import type { FunctionSignature } from './FunctionImplementation.ts';
import type { TypedFunctionCallable } from './TypedFunctionImplementation.ts';
import { TypedFunctionImplementation } from './TypedFunctionImplementation.ts';

export class NumberFunction extends TypedFunctionImplementation<number> {
	constructor(
		localName: string,
		signature: FunctionSignature,
		call: TypedFunctionCallable<number>
	) {
		super(localName, NumberEvaluation, signature, call);
	}
}
