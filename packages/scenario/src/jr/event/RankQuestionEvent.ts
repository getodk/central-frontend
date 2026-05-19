import { xmlXPathWhitespaceSeparatedList } from '@getodk/common/lib/string/whitespace.ts';
import { RankNodeAnswer } from '../../answer/RankNodeAnswer.ts';
import { UntypedAnswer } from '../../answer/UntypedAnswer.ts';
import { QuestionEvent } from './QuestionEvent.ts';
import type { ValueNodeAnswer } from '../../answer/ValueNodeAnswer.ts';

export class RankQuestionEvent extends QuestionEvent<'rank'> {
	getAnswer(): RankNodeAnswer {
		return new RankNodeAnswer(this.node);
	}

	answerQuestion(answerValue: unknown): ValueNodeAnswer {
		const { node } = this;
		const { stringValue } = new UntypedAnswer(answerValue);
		const valueList = xmlXPathWhitespaceSeparatedList(stringValue, {
			ignoreEmpty: true,
		});

		node.setValues(valueList);
		return new RankNodeAnswer(node);
	}
}
