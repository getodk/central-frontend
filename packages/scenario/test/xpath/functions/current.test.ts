import { beforeEach, describe, expect, it } from 'vitest';
import { stringAnswer } from '../../../src/answer/ExpectedStringAnswer.ts';
import { choice } from '../../../src/choice/ExpectedChoice.ts';
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
			it('should be the same as a relative ref', async () => {
				const scenario = await Scenario.init('relative-current-ref-field-ref.xml');

				// The ref on /data/my_group[1]/name uses current()/name instead of an absolute path
				scenario.answer('/data/my_group[1]/name', 'Bob');

				scenario.proposed_addExplicitCreateNewRepeatCallHere('/data/my_group', {
					explicitRepeatCreation: true,
				});

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

	/**
	 * **PORTING NOTES**
	 *
	 * Insofar as these tests deal with `calculate` and/or other `<bind>`
	 * expressions, it is likely we'll want to move them to suites more
	 * appropriate for that functionality. They're here out of... sheer laziness
	 * so near the end of this porting process.
	 */
	describe('CurrentTest.java', () => {
		let scenario: Scenario;

		/**
		 * **PORTING NOTES**
		 *
		 * - Fixture is shared across multiple tests in this case.
		 *
		 * - To the extent the repeat functionality in this not tested elsewhere,
		 *   we should consider adding a couple repeat-specific tests too.
		 */
		beforeEach(async () => {
			scenario = await Scenario.init('relative-current-ref.xml');
		});

		describe('`current()` as `calculate` root', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Rephrase? Understanding is that `current()` should reference the
			 * specific context node, not necessarily the bound `nodeset`, e.g. in the
			 * case of repeat instances and their descendants.
			 *
			 * JR:
			 *
			 * current() in a calculate should refer to the node it is in (in this
			 * case, /data/my_group/name_relative). This means that to refer to a
			 * sibling node, the path should be current()/../<name of sibling node>.
			 * This is verified by changing the value of the node that the calculate
			 * is supposed to refer to (/data/my_group/name) and seeing that the
			 * dependent calculate is updated accordingly.
			 */
			it('should refer to [the bound node] its bound `nodeset`', () => {
				scenario.answer('/data/my_group/name', 'Bob');

				// JR:
				//
				// The binding of /data/my_group/name_relative is:
				//   <bind calculate="current()/../name" nodeset="/data/my_group/name_relative" type="string"/>
				// That will copy the value of our previous answer to /data/my_group/name
				expect(scenario.answerOf('/data/my_group/name_relative')).toEqualAnswer(
					scenario.answerOf('/data/my_group/name')
				);
			});
		});

		describe('`current()` as itemset choice filter root', () => {
			/**
			 * JR:
			 *
			 * current() in a choice filter should refer to the select node the choice
			 * filter is called from, NOT the expression it is in. See
			 * https://developer.mozilla.org/en-US/docs/Web/XPath/Functions/current --
			 * this is the difference between current() and .
			 * <p>
			 * The behavior of current() in a choice filter is verified by selecting a
			 * value for a first, static select and then using that value to filter a
			 * second, dynamic select.
			 */
			it('should refer to the select node', () => {
				scenario.answer('/data/fruit', 'blueberry');

				const choices = scenario.choicesOf('/data/variety');
				// The itemset for /data/variety is instance('variety')/root/item[fruit = current()/../fruit]
				// and the "variety" instance has three items for blueberry: blueray,
				// collins, and duke
				expect(choices).toContainChoicesInAnyOrder([
					choice('blueray'),
					choice('collins'),
					choice('duke'),
				]);
			});
		});
	});
});
