import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { EvaluableArgument, FunctionSignature } from './FunctionImplementation.ts';
import { FunctionImplementation } from './FunctionImplementation.ts';

export type NodeSetFunctionCallable = <
	T extends XPathNode,
	Arguments extends readonly EvaluableArgument[],
>(
	context: LocationPathEvaluation<T>,
	args: Arguments
) => readonly T[];

export class NodeSetFunction extends FunctionImplementation {
	constructor(localName: string, signature: FunctionSignature, call: NodeSetFunctionCallable) {
		super(localName, signature, (context, args) => {
			const nodes = call(context, args);

			return LocationPathEvaluation.fromArbitraryNodes(context, nodes, this);
		});
	}
}
