import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

// Ported as of https://github.com/getodk/javarosa/commit/5ae68946c47419b83e7d28290132d846e457eea6
describe('Secondary instances', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * In a Slack discussion, we decided to skip the first several tests in
	 * `PredicateCachingTest.java` (concerned with measuring the number of
	 * evaluations performed for a given form and/or action within it); we also
	 * decided to port the remaining tests (which exercise correctness concerns),
	 * organized into other modules as appropriate.
	 */
	describe('PredicateCachingTest.java', () => {
		/**
		 * JR:
		 * A form with multiple secondary instances can have expressions with "equivalent" predicates that filter on
		 * different sets of children. It's pretty possible to write a bug where these predicates are treated as the same
		 * thing causing incorrect answers.
		 */
		describe('equivalent predicate expressions on different references', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * 1. Rephrase as "produces distinct results from each secondary instance"?
			 * 2. The test itself could be more clear, presumably by making the
			 *    derived values from each secondary instance distinct.
			 *
			 * The test below is an attempt at that, but notably required a change
			 * to the test fixture. If we go with that, we'll probalby want to revise
			 * the original fixture (and perhaps revise both in JavaRosa).
			 */
			it('[is] are not confused', async () => {
				const scenario = await Scenario.init('two-secondary-instances.xml');

				scenario.next('/data/choice');
				scenario.answer('a');

				expect(scenario.answerOf('/data/both').getValue()).toBe('AA');
			});

			describe('(potentially clearer variation of above test)', () => {
				it('produces distinct results from each secondary instance', async () => {
					const scenario = await Scenario.init('two-secondary-instances-alt.xml');

					scenario.next('/data/choice');
					scenario.answer('c');

					expect(scenario.answerOf('/data/both').getValue()).toBe(
						'C (from instance_one)C (from instance_two)'
					);
				});
			});
		});
	});
});
