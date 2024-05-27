import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { intAnswer } from '../src/answer/ExpectedIntAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';

describe('TriggerableDagTest.java', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * Rephrase? While DAG ordering is certainly under test, and while it's an
	 * explicit spec concern, there's also more specific computation logic under
	 * test which is worth describing as the functionality under test.
	 */
	it('[recomputes `calculate` expressions when their dependencies are updated] order of the DAG is ensured', async () => {
		const scenario = await Scenario.init(
			'Some form',
			html(
				head(
					title('Some form'),
					model(
						mainInstance(t('data id="some-form"', t('a', '2'), t('b'), t('c'))),
						bind('/data/a').type('int'),
						bind('/data/b').type('int').calculate('/data/a * 3'),
						bind('/data/c').type('int').calculate('(/data/a + /data/b) * 5')
					)
				),
				body(input('/data/a'))
			)
		);

		expect(scenario.answerOf('/data/a')).toEqualAnswer(intAnswer(2));
		expect(scenario.answerOf('/data/b')).toEqualAnswer(intAnswer(6));
		expect(scenario.answerOf('/data/c')).toEqualAnswer(intAnswer(40));

		scenario.answer('/data/a', 3);

		expect(scenario.answerOf('/data/a')).toEqualAnswer(intAnswer(3));
		expect(scenario.answerOf('/data/b')).toEqualAnswer(intAnswer(9));
		// Verify that c gets computed using the updated value of b.
		expect(scenario.answerOf('/data/c')).toEqualAnswer(intAnswer(60));
	});
});
