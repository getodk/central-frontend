import {
	body,
	head,
	html,
	instance,
	item,
	mainInstance,
	model,
	rankDynamic,
	selectDynamic,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, it, expect } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';
import { r } from '../src/jr/resource/ResourcePathHelper.ts';

describe('Rank', () => {
	it('should preserve the order of values when set, if the rank contains <item>s', async () => {
		const RANK_QUESTION = '/data/rankWidget';
		const scenario = await Scenario.init(r('rank-form.xml'));

		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('');

		scenario.answer(RANK_QUESTION, 'A', 'E', 'C', 'B', 'D', 'F', 'G');

		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('A E C B D F G');
	});

	it('should preserve the order of values when set, if the rank contains an <itemset>', async () => {
		const RANK_QUESTION = '/data/rankQuestion';
		const form = html(
			head(
				title('Rank form'),
				model(
					mainInstance(t("data id='rank'", t('rankQuestion'))),

					instance(
						'options',
						item('option1', 'Option 1'),
						item('option2', 'Option 2'),
						item('option3', 'Option 3'),
						item('option4', 'Option 4')
					)
				)
			),
			body(rankDynamic('/data/rankQuestion', "instance('options')/root/item"))
		);
		const scenario = await Scenario.init('Rank form', form);

		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('');

		scenario.answer(RANK_QUESTION, 'option1', 'option4', 'option2', 'option3');

		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('option1 option4 option2 option3');
	});

	it('should order options correctly when the rank question becomes relevant', async () => {
		const SELECT_QUESTION = '/data/selectQuestion';
		const RANK_QUESTION = '/data/rankQuestion';
		const form = html(
			head(
				title('Rank with choice filter'),
				model(
					mainInstance(t("data id='rank'", t('rankQuestion'), t('selectQuestion'))),

					instance(
						'options',
						item('option1', 'Option 1'),
						item('option2', 'Option 2'),
						item('option3', 'Option 3'),
						item('option4', 'Option 4'),
						item('option5', 'Option 5')
					)
				)
			),
			body(
				selectDynamic('/data/selectQuestion', "instance('options')/root/item"),

				rankDynamic(
					'/data/rankQuestion',
					"instance('options')/root/item[selected(/data/selectQuestion, value)]"
				)
			)
		);
		const scenario = await Scenario.init('Rank with choice filter', form);

		expect(scenario.answerOf(SELECT_QUESTION).getValue()).toBe('');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('');

		scenario.answer(SELECT_QUESTION, 'option1', 'option4', 'option3', 'option2');
		expect(scenario.answerOf(SELECT_QUESTION).getValue()).toBe('option1 option2 option3 option4');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('');

		scenario.answer(RANK_QUESTION, 'option4', 'option1', 'option2', 'option3');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('option4 option1 option2 option3');

		// Make rank not relevant
		scenario.answer(SELECT_QUESTION, '');
		expect(scenario.answerOf(SELECT_QUESTION).getValue()).toBe('');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('');

		// Make rank relevant again
		scenario.answer(SELECT_QUESTION, 'option1', 'option5');
		expect(scenario.answerOf(SELECT_QUESTION).getValue()).toBe('option1 option5');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('option1 option5');

		scenario.answer(RANK_QUESTION, 'option5', 'option1');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('option5 option1');
	});

	it('should include all values on write and preserve the order of options when rank is relevant', async () => {
		const SELECT_QUESTION = '/data/selectQuestion';
		const RANK_QUESTION = '/data/rankQuestion';
		const form = html(
			head(
				title('Rank includes all values'),
				model(
					mainInstance(t("data id='rank'", t('rankQuestion'), t('selectQuestion'))),

					instance(
						'options',
						item('option1', 'Option 1'),
						item('option2', 'Option 2'),
						item('option3', 'Option 3'),
						item('option4', 'Option 4')
					)
				)
			),
			body(
				selectDynamic('/data/selectQuestion', "instance('options')/root/item"),

				rankDynamic(
					'/data/rankQuestion',
					"instance('options')/root/item[selected(/data/selectQuestion, value)]"
				)
			)
		);
		const scenario = await Scenario.init('Rank includes all values', form);

		expect(scenario.answerOf(SELECT_QUESTION).getValue()).toBe('');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('');

		scenario.answer(SELECT_QUESTION, 'option1', 'option4', 'option3', 'option2');
		expect(scenario.answerOf(SELECT_QUESTION).getValue()).toBe('option1 option2 option3 option4');
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe('');

		scenario.answer(RANK_QUESTION, 'option2', 'option1', 'option3', 'option4');
		const RANK_EXPECTED_VALUE = 'option2 option1 option3 option4';
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe(RANK_EXPECTED_VALUE);

		// Set an incomplete value is not allowed for rank.
		// This is wrapped as a function to assert that this is enforced by the engine.
		const answerWithMissingValues = () => {
			scenario.answer(RANK_QUESTION, 'option4', 'option2');
		};

		// Assert: engine enforces requirement to set all available rank values.
		expect(answerWithMissingValues).to.throw(
			'There are missing options. Rank should have all options.'
		);

		// Assert: attempting failed incomplete answer doesn't change value state.
		expect(scenario.answerOf(RANK_QUESTION).getValue()).toBe(RANK_EXPECTED_VALUE);
	});
});
