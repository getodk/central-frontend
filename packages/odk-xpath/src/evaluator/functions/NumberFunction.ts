import { NumberEvaluation } from '../../evaluations/NumberEvaluation.ts';
import type { FunctionSignature } from './FunctionImplementation.ts';
import type { TypedFunctionCallable } from './TypedFunctionImplementation.ts';
import { TypedFunctionImplementation } from './TypedFunctionImplementation.ts';

export class NumberFunction<Length extends number> extends TypedFunctionImplementation<
	number,
	Length
> {
	constructor(
		localName: string,
		signature: FunctionSignature<Length>,
		call: TypedFunctionCallable<number>
	) {
		super(localName, NumberEvaluation, signature, call);
	}
}
