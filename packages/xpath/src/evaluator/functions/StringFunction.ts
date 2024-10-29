import { StringEvaluation } from '../../evaluations/StringEvaluation.ts';
import type { FunctionSignature } from './FunctionImplementation.ts';
import type { TypedFunctionCallable } from './TypedFunctionImplementation.ts';
import { TypedFunctionImplementation } from './TypedFunctionImplementation.ts';

export class StringFunction extends TypedFunctionImplementation<string> {
	constructor(
		localName: string,
		signature: FunctionSignature,
		call: TypedFunctionCallable<string>
	) {
		super(localName, signature, call, (context, value) => {
			return new StringEvaluation(context, value);
		});
	}
}
