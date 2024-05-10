import { describe, expect, it } from 'vitest';
import { stringAnswer } from '../../../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../../src/jr/Scenario.ts';

/**
 *
 * **PORTING NOTES**
 *
 * Where JavaRosa performs {@link Scenario} initialization in a `@Before` ...
 * `setUp` method, for a "vat" with a single test, we perform the setup directly
 * in the function body for test clarity.
 */
describe('XPath function support: `current`', () => {
	describe('CurrentFieldRefTest.java', () => {
		describe('`current()` in a field ref', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Is this... a thing? Failing pending feature support, if it turns out to
			 * be something we want to support.
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

	describe('CurrentGroupCountRefTest.java', () => {
		describe('`current()` in repeat count', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Rephrase?
			 *
			 * - Expected to fail pending `jr:count` feature support.
			 *
			 * - Note that form fixture uses relative body references. It will likely
			 *   fail for that as well, unless we support it or edit the fixture.
			 *
			 * - Editorial on that last point: it seems likely that we'll get much
			 *   more mileage out of just accepting that we should support this
			 *   functionality (and potentially even `current()` as in the above
			 *   test!) than trying to whack-a-mole the many tests where it's a
			 *   factor. It probably isn't a huge lift to support anyway.
			 *
			 * - Per some quick discussion on Slack, it sounds like the above
			 *   editorial point might be going the right direction.
			 *
			 * - The directly ported assertions seemed weirdly ordered. Given the
			 *   end-of-form check will now be redundant, it's worth considering just
			 *   removing that oddly timed second check. (It's commented out for now.)
			 */
			it.fails(
				'[references the current repeat instance as its context node] should work as expected',
				async () => {
					const scenario = await Scenario.init('relative-current-ref-group-count-ref.xml');

					// JR:
					//
					// Since the form sets a count of 3 repeats, we should be at the end
					// of the form after answering three times
					scenario.next('/data/my_group[1]');
					scenario.next('/data/my_group[1]/name');
					scenario.answer('Janet');
					scenario.next('/data/my_group[2]');
					scenario.next('/data/my_group[2]/name');
					scenario.answer('Bob');
					scenario.next('/data/my_group[3]');
					scenario.next('/data/my_group[3]/name');
					scenario.answer('Kim');
					scenario.next('END_OF_FORM');

					expect(scenario.answerOf('/data/my_group[1]/name')).toEqualAnswer(stringAnswer('Janet'));
					expect(scenario.answerOf('/data/my_group[2]/name')).toEqualAnswer(stringAnswer('Bob'));
					expect(scenario.answerOf('/data/my_group[3]/name')).toEqualAnswer(stringAnswer('Kim'));
					// assertThat(scenario.atTheEndOfForm(), is(true));
					expect(scenario.countRepeatInstancesOf('/data/my_group')).toBe(3);
				}
			);
		});
	});
});
