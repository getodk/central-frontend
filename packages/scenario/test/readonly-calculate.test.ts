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

/**
 * **PORTING NOTES**
 *
 * While this module presently only ports a single JavaRosa test, it may serve
 * as a good example of organizing tests around the interaction and/or
 * intersection of certain features. It _feels beneficial_ from the outset:
 * there's no ambiguity about where I'd go if I want to answer "how does
 * `calculate` work when a field is `readonly`?"
 */
describe('Interaction between `readonly` and `calculate`', () => {
	describe('ReadOnlyCalculateTest.java', () => {
		describe('`calculate`', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Rephrase?
			 *
			 * - As discussed in `actions-events.test.ts`, on a test which ports a
			 *   similar comment, the below comment from JavaRosa reaches the right
			 *   conclusion, but for the wrong reason. The `readonly` expression is
			 *   not _only_ a UI concern, it has other write restrictions. But
			 *   `calculate` is expected to be able to perform writes to `readonly`
			 *   fields (as are actions/events, as discussed in that module).
			 *
			 * - - -
			 *
			 * JR:
			 *
			 * Read-only is only a UI concern so calculates should be evaluated on
			 * read-only fields.
			 */
			it('[is] evaluated on `readonly` field with [corresponding body element] UI', async () => {
				const scenario = await Scenario.init(
					'Calculate readonly',
					html(
						head(
							title('Calculate readonly'),
							model(
								mainInstance(t('data id="calculate-readonly"', t('readonly-calculate'))),
								bind('/data/readonly-calculate').readonly('1').calculate('7 * 2')
							)
						),
						body(input('/data/readonly-calculate'))
					)
				);

				expect(scenario.answerOf('/data/readonly-calculate')).toEqualAnswer(intAnswer(14));
			});
		});
	});
});
