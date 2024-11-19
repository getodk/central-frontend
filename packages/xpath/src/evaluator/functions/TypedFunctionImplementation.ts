import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { Evaluation } from '../../evaluations/Evaluation';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { EvaluableArgument, FunctionSignature } from './FunctionImplementation.ts';
import { FunctionImplementation } from './FunctionImplementation.ts';

export type TypedFunctionCallable<R> = <
	T extends XPathNode,
	Arguments extends readonly EvaluableArgument[],
>(
	context: LocationPathEvaluation<T>,
	args: Arguments
) => R;

export type TypedFunctionResultFactory<R> = <T extends XPathNode>(
	context: LocationPathEvaluation<T>,
	value: R
) => Evaluation<T>;

export abstract class TypedFunctionImplementation<R> extends FunctionImplementation {
	protected constructor(
		localName: string,
		signature: FunctionSignature,
		call: TypedFunctionCallable<R>,
		resultFactory: TypedFunctionResultFactory<R>
	) {
		super(localName, signature, (context, args) => {
			const result = call(context, args);

			return resultFactory(context, result);
		});
	}
}
