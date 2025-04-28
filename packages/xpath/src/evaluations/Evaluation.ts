import type { XPathNode } from '../adapter/interface/XPathNode.ts';
import type { EvaluationType } from './EvaluationType.ts';
import type { LocationPathEvaluation } from './LocationPathEvaluation.ts';

export interface Evaluation<T extends XPathNode, Type extends EvaluationType = EvaluationType>
	extends Iterable<Evaluation<T, Type>> {
	readonly context: LocationPathEvaluation<T>;
	readonly type: Type;

	first(): Evaluation<T, Type> | null;
	values(): ReadonlyArray<Evaluation<T, Type>>;

	eq(operand: Evaluation<T>): boolean;
	ne(operand: Evaluation<T>): boolean;
	lt(operand: Evaluation<T>): boolean;
	lte(operand: Evaluation<T>): boolean;
	gt(operand: Evaluation<T>): boolean;
	gte(operand: Evaluation<T>): boolean;

	toBoolean(): boolean;
	toNumber(): number;
	toString(): string;

	readonly nodes: Type extends 'NODE' ? ReadonlySet<T> : null;
}
