import type { Evaluation } from '../../evaluations/Evaluation';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { EvaluableArgument, FunctionSignature } from './FunctionImplementation.ts';
import { FunctionImplementation } from './FunctionImplementation.ts';

export type TypedFunctionCallable<Type> = <Arguments extends readonly EvaluableArgument[]>(
	context: LocationPathEvaluation,
	args: Arguments
) => Type;

export class TypedFunctionImplementation<Type> extends FunctionImplementation {
	protected constructor(
		localName: string,
		TypedResult: new (context: LocationPathEvaluation, value: Type) => Evaluation,
		signature: FunctionSignature,
		call: TypedFunctionCallable<Type>
	) {
		super(
			localName,
			signature,
			(context: LocationPathEvaluation, args: readonly EvaluableArgument[]) => {
				const runtimeResult = call(context, args);

				return new TypedResult(context, runtimeResult);
			}
		);
	}
}
