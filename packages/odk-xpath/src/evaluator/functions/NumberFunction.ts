import { NumberEvaluation } from '../../evaluations/NumberEvaluation.ts';
import type { FunctionImplementationOptions, FunctionSignature } from './FunctionImplementation.ts';
import type { TypedFunctionCallable } from './TypedFunctionImplementation.ts';
import { TypedFunctionImplementation } from './TypedFunctionImplementation.ts';

export class NumberFunction<Length extends number> extends TypedFunctionImplementation<
	number,
	Length
> {
	constructor(
		signature: FunctionSignature<Length>,
		call: TypedFunctionCallable<number>,
		options?: FunctionImplementationOptions
	) {
		super(NumberEvaluation, signature, call, options);
	}
}
