import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { PrimitiveResult } from './PrimitiveResult.ts';
import type { XPathEvaluationResult } from './XPathEvaluationResult.ts';

export class StringResult<T extends XPathNode>
	extends PrimitiveResult<T>
	implements XPathEvaluationResult<T>
{
	protected readonly nodes = null;

	readonly resultType = PrimitiveResult.STRING_TYPE;
	readonly booleanValue: boolean;
	readonly numberValue: number;
	readonly stringValue: string;

	constructor(evaluation: Evaluation<T>) {
		super();

		this.stringValue = evaluation.toString();
		this.booleanValue = evaluation.toBoolean();
		this.numberValue = evaluation.toNumber();
	}
}
