import type { EvaluationType } from './EvaluationType.ts';
import type { LocationPathEvaluation } from './LocationPathEvaluation.ts';

export interface Evaluation<Type extends EvaluationType = EvaluationType>
	extends Iterable<Evaluation<Type>> {
	readonly context: LocationPathEvaluation;
	readonly type: Type;

	first(): Evaluation<Type> | null;
	values(): Iterable<Evaluation<Type>>;

	eq(operand: Evaluation): boolean;
	ne(operand: Evaluation): boolean;
	lt(operand: Evaluation): boolean;
	lte(operand: Evaluation): boolean;
	gt(operand: Evaluation): boolean;
	gte(operand: Evaluation): boolean;

	toBoolean(): boolean;
	toNumber(): number;
	toString(): string;

	readonly nodes: Type extends 'NODE' ? Iterable<Node> : null;
}
