import { StringEvaluation } from '../../evaluations/StringEvaluation.ts';
import type { FunctionSignature } from './FunctionImplementation.ts';
import type { TypedFunctionCallable } from './TypedFunctionImplementation.ts';
import { TypedFunctionImplementation } from './TypedFunctionImplementation.ts';

export class StringFunction<Length extends number> extends TypedFunctionImplementation<
	string,
	Length
> {
	constructor(
		localName: string,
		signature: FunctionSignature<Length>,
		call: TypedFunctionCallable<string>
	) {
		super(localName, StringEvaluation, signature, call);
	}
}
