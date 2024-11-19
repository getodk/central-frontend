import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { PrimitiveResult } from './PrimitiveResult.ts';
import type { XPathEvaluationResult } from './XPathEvaluationResult.ts';

export class BooleanResult<T extends XPathNode>
	extends PrimitiveResult<T>
	implements XPathEvaluationResult<T>
{
	protected readonly nodes = null;

	readonly resultType = PrimitiveResult.BOOLEAN_TYPE;
	readonly booleanValue: boolean;
	readonly numberValue: number;
	readonly stringValue: string;

	constructor(evaluation: Evaluation<T>) {
		super();

		this.booleanValue = evaluation.toBoolean();
		this.numberValue = evaluation.toNumber();
		this.stringValue = evaluation.toString();
	}
}
