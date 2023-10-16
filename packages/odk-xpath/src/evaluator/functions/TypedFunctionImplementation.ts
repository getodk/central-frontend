import type { Evaluation } from '../../evaluations/Evaluation';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type {
	EvaluableArgument,
	FunctionImplementationOptions,
	FunctionSignature,
} from './FunctionImplementation.ts';
import { FunctionImplementation } from './FunctionImplementation.ts';

export type TypedFunctionCallable<Type> = <Arguments extends readonly EvaluableArgument[]>(
	context: LocationPathEvaluation,
	args: Arguments
) => Type;

export class TypedFunctionImplementation<
	Type,
	Length extends number,
> extends FunctionImplementation<Length> {
	protected constructor(
		TypedResult: new (context: LocationPathEvaluation, value: Type) => Evaluation,
		signature: FunctionSignature<Length>,
		call: TypedFunctionCallable<Type>,
		options?: FunctionImplementationOptions
	) {
		super(
			signature,
			(context: LocationPathEvaluation, args: readonly EvaluableArgument[]) => {
				const runtimeResult = call(context, args);

				return new TypedResult(context, runtimeResult);
			},
			options
		);
	}
}
