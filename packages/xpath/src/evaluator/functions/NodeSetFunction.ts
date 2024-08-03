import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { ContextNode } from '../../lib/dom/types.ts';
import type { EvaluableArgument, FunctionSignature } from './FunctionImplementation.ts';
import { FunctionImplementation } from './FunctionImplementation.ts';

export type NodeSetFunctionCallable = <Arguments extends readonly EvaluableArgument[]>(
	context: LocationPathEvaluation,
	args: Arguments
) => Iterable<Node>;

export class NodeSetFunction extends FunctionImplementation {
	constructor(localName: string, signature: FunctionSignature, call: NodeSetFunctionCallable) {
		super(localName, signature, (context, args) => {
			const nodes = call(context, args);

			return LocationPathEvaluation.fromArbitraryNodes(
				context,
				nodes as Iterable<ContextNode>,
				this
			);
		});
	}
}
