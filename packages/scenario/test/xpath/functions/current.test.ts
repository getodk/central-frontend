import { describe, expect, it } from 'vitest';
import { stringAnswer } from '../../../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../../src/jr/Scenario.ts';

describe('XPath function support: `current`', () => {
	describe('CurrentFieldRefTest.java', () => {
		describe('`current()` in a field ref', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - JavaRosa performs {@link Scenario} initialization in a `@Before` ...
			 *   `setUp` method. It's unclear why, for a single test (maybe there's a
			 *   pattern across similar tests?). We initialize the scenario directly
			 *   in the test body for test clarity.
			 *
			 * - Is this... a thing? Failing pending feature support, if it turns out
			 *   to be something we want to support.
			 */
			it.fails('should be the same as a relative ref', async () => {
				const scenario = await Scenario.init('relative-current-ref-field-ref.xml');

				// The ref on /data/my_group[1]/name uses current()/name instead of an absolute path
				scenario.answer('/data/my_group[1]/name', 'Bob');
				scenario.answer('/data/my_group[2]/name', 'Janet');

				expect(scenario.answerOf('/data/my_group[1]/name')).toEqualAnswer(stringAnswer('Bob'));

				expect(scenario.answerOf('/data/my_group[2]/name')).toEqualAnswer(stringAnswer('Janet'));
			});
		});
	});
});
