import type { AnyInputNode, DecimalInputNode, IntInputNode } from '@getodk/xforms-engine';
import { InputNodeAnswer } from '../../answer/InputNodeAnswer.ts';
import { UntypedAnswer } from '../../answer/UntypedAnswer.ts';
import type { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';
import { QuestionEvent } from './QuestionEvent.ts';

export class InputQuestionEvent extends QuestionEvent<'input'> {
	getAnswer(): InputNodeAnswer {
		return new InputNodeAnswer(this.node);
	}

	private answerDefault(node: AnyInputNode, answerValue: unknown): ValueNodeAnswer {
		const { stringValue } = new UntypedAnswer(answerValue);

		node.setValue(stringValue);

		return new InputNodeAnswer(node);
	}

	private answerNumericQuestionNode(
		node: DecimalInputNode | IntInputNode,
		answerValue: unknown
	): ValueNodeAnswer {
		if (answerValue === null) {
			node.setValue(answerValue);

			return new InputNodeAnswer(node);
		}

		switch (typeof answerValue) {
			case 'bigint':
			case 'number':
			case 'string':
				node.setValue(answerValue);

				return new InputNodeAnswer(node);

			default:
				return this.answerDefault(node, answerValue);
		}
	}

	answerQuestion(answerValue: unknown): ValueNodeAnswer {
		const { node } = this;

		switch (node.valueType) {
			case 'int':
			case 'decimal':
				return this.answerNumericQuestionNode(node, answerValue);

			default:
				return this.answerDefault(node, answerValue);
		}
	}
}
