import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { XPathNode } from '../adapter/interface/XPathNode.ts';
import type { Evaluation } from './Evaluation.ts';
import type { EvaluationType, EvaluationTypes } from './EvaluationType.ts';
import { LocationPathEvaluation } from './LocationPathEvaluation.ts';

export abstract class ValueEvaluation<T extends XPathNode, Type extends EvaluationType>
	implements Evaluation<T, Type>
{
	abstract readonly context: LocationPathEvaluation<T>;

	abstract readonly type: Type;
	abstract readonly value: EvaluationTypes<T>[Type];
	abstract readonly nodes: Type extends 'NODE' ? Iterable<T> : null;

	protected abstract readonly booleanValue: boolean;
	protected abstract readonly numberValue: number;
	protected abstract readonly stringValue: string;

	[Symbol.iterator]() {
		return this.values();
	}

	first(): this {
		return this;
	}

	values(): IterableIterator<this> {
		return [this].values();
	}

	toBoolean(): boolean {
		return this.booleanValue;
	}

	toNumber(): number {
		return this.numberValue;
	}

	toString(): string {
		return this.stringValue;
	}

	eq(operand: Evaluation<T>): boolean {
		if (this.type === 'BOOLEAN') {
			return this.toBoolean() === operand.toBoolean();
		}

		if (operand instanceof LocationPathEvaluation) {
			return operand.some((rhs) => this.eq(rhs));
		}

		if (this.type === 'NODE') {
			switch (operand.type) {
				case 'BOOLEAN':
					return this.toBoolean() === operand.toBoolean();

				case 'NUMBER':
					return this.toNumber() === operand.toNumber();

				case 'NODE':
				case 'STRING':
					return this.toString() === operand.toString();

				default:
					throw new UnreachableError(operand.type);
			}
		}

		if (operand.type === 'NODE') {
			return operand.eq(this);
		}

		if (this.type === 'BOOLEAN' || operand.type === 'BOOLEAN') {
			return this.toBoolean() === operand.toBoolean();
		}

		if (this.type === 'NUMBER' || operand.type === 'NUMBER') {
			return this.toNumber() === operand.toNumber();
		}

		return this.toString() === operand.toString();
	}

	ne(operand: Evaluation<T>): boolean {
		if (this.type === 'BOOLEAN') {
			return this.toBoolean() !== operand.toBoolean();
		}

		if (operand instanceof LocationPathEvaluation) {
			return operand.some((rhs) => this.ne(rhs));
		}

		return !this.eq(operand);
	}

	lt(operand: Evaluation<T>): boolean {
		if (operand instanceof LocationPathEvaluation) {
			return operand.some((rhs) => this.lt(rhs));
		}

		return this.toNumber() < operand.toNumber();
	}

	lte(operand: Evaluation<T>): boolean {
		if (operand instanceof LocationPathEvaluation) {
			return operand.some((rhs) => this.lte(rhs));
		}

		return this.toNumber() <= operand.toNumber();
	}

	gt(operand: Evaluation<T>): boolean {
		if (operand instanceof LocationPathEvaluation) {
			return operand.some((rhs) => this.gt(rhs));
		}

		return this.toNumber() > operand.toNumber();
	}

	gte(operand: Evaluation<T>): boolean {
		if (operand instanceof LocationPathEvaluation) {
			return operand.some((rhs) => this.gte(rhs));
		}

		return this.toNumber() >= operand.toNumber();
	}
}
