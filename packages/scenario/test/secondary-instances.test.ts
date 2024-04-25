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

		describe('equivalent predicate expressions in repeats', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * 1. Rephrase?
			 * 2. The original JavaRosa test's second assertion checks for the answer
			 *    (`answerOf` return value) to be `equalTo(null)`. It seems likely
			 *    given the form's shape that the intent is to check that the field is
			 *    present and its value is blank, at that point in time.
			 * 3. (HUNCH ONLY!) I'm betting this failure is related to the form's
			 *    `current()` sub-expression (which I doubt is being accounted for in
			 *    dependency analysis, and is therefore failing to establish a
			 *    reactive subscription within the engine).
			 */
			it.fails('[does] do not get confused', async () => {
				const scenario = await Scenario.init('repeat-secondary-instance.xml');

				scenario.createNewRepeat('/data/repeat');
				scenario.createNewRepeat('/data/repeat');

				scenario.answer('/data/repeat[1]/choice', 'a');

				expect(scenario.answerOf('/data/repeat[1]/calculate').getValue()).toBe('A');
				// assertThat(scenario.answerOf('/data/repeat[2]/calculate'), equalTo(null));
				expect(scenario.answerOf('/data/repeat[1]/calculate').getValue()).toBe('');

				scenario.answer('/data/repeat[2]/choice', 'b');

				expect(scenario.answerOf('/data/repeat[1]/calculate').getValue()).toBe('A');
				expect(scenario.answerOf('/data/repeat[2]/calculate').getValue()).toBe('B');
			});
		});
	});
});
