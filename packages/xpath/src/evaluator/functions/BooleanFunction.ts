import { BooleanEvaluation } from '../../evaluations/BooleanEvaluation.ts';
import type { FunctionSignature } from './FunctionImplementation.ts';
import type { TypedFunctionCallable } from './TypedFunctionImplementation.ts';
import { TypedFunctionImplementation } from './TypedFunctionImplementation.ts';

export class BooleanFunction<Length extends number> extends TypedFunctionImplementation<
	boolean,
	Length
> {
	constructor(
		localName: string,
		signature: FunctionSignature<Length>,
		call: TypedFunctionCallable<boolean>
	) {
		super(localName, BooleanEvaluation, signature, call);
	}
}
