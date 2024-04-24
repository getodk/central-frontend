import {
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	repeat,
	select1Dynamic,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { choice } from '../src/choice/ExpectedChoice.ts';
import { Scenario } from '../src/jr/Scenario.ts';

describe('DynamicSelectUpdateTest.java', () => {
	/**
	 * @todo - per Slack discussion, we will update JavaRosa's corresponding tests
	 * to use absolute paths in body references. For now, we run the affected tests
	 * against the fixture as it currently exists in JR, and then against the same
	 * fixture with absolute paths substituted in place of their relative
	 * counterparts (i.e. {@link substituteAbsoluteBodyReferences}: `true`).
	 *
	 * @see
	 * {@link https://github.com/getodk/javarosa/pull/759/commits/c72b80bf1c5044745cadd573ef87f46255f25df0}
	 */
	interface GetSelectFromRepeatFormOptions {
		readonly substituteAbsoluteBodyReferences: boolean;
	}

	// Ported as of https://github.com/getodk/javarosa/commit/5ae68946c47419b83e7d28290132d846e457eea6
	describe.each<GetSelectFromRepeatFormOptions>([
		{ substituteAbsoluteBodyReferences: false },
		{ substituteAbsoluteBodyReferences: true },
	])(
		'substituting absolute body references: $substituteAbsoluteBodyReferences',
		({ substituteAbsoluteBodyReferences }) => {
			// // TODO: didn't need this for the first test, but it's here in case there
			// // are subsequent tests which would use it. REMOVE THIS if it isn't used in
			// // any tests submitted in the bulk test port PR.
			// const relativeBodyRefTest = {
			// 	/**
			// 	 * Use for tests which fail **because** the form fixture uses relative
			// 	 * body references.
			// 	 */
			// 	it: substituteAbsoluteBodyReferences ? it : it.fails,
			// } as const;

			const getSelectFromRepeatForm = (predicate = '') => {
				const repeatValueInputRef = substituteAbsoluteBodyReferences
					? '/data/repeat/value'
					: 'value';
				const repeatLabelInputRef = substituteAbsoluteBodyReferences
					? '/data/repeat/label'
					: 'label';
				const filterInputRef = substituteAbsoluteBodyReferences ? '/data/filter' : 'filter';

				return html(
					head(
						title('Select from repeat'),
						model(
							mainInstance(
								t(
									"data id='repeat-select'",
									t('repeat', t('value'), t('label')),
									t('filter'),
									t('select')
								)
							)
						)
					),
					body(
						repeat('/data/repeat', input(repeatValueInputRef), input(repeatLabelInputRef)),
						input(filterInputRef),
						select1Dynamic('/data/select', '../repeat' + (predicate !== '' ? `[${predicate}]` : ''))
					)
				);
			};

			/**
			 * Integration tests to verify that the choice lists for "dynamic selects"
			 * (selects with itemsets rather than inline items) are updated when
			 * dependent values change.
			 *
			 * See also:
			 * - {@see SelectOneChoiceFilterTest}
			 * - {@see SelectMultipleChoiceFilterTest} for coverage of dynamic select
			 *   multiples
			 * - {@see XPathFuncExprRandomizeTest} for coverage of choice list updates
			 *   when randomization is specified
			 *
			 * **PORTING NOTES**
			 *
			 * 1. The above reference to `XPathFuncExprRandomizeTest` doesn't resolve to
			 *    anything here, but it evidently doesn't resolve to anything in
			 *    JavaRosa (anymore?) either.
			 *
			 * 2. Despite accommodating relative body `ref` attributes, this test still
			 *    fails. A brief side quest to investigate the nature of the failure
			 *    revealed that:
			 *
			 *    - Even without supporting relative `ref`s on controls, we'll need to
			 *      do so for `<itemset>` and its `<value>` child (presumably its
			 *      `<label>` child as well). The concern is so general we probably
			 *      might as well actually just support them all.
			 *
			 *    - Even resolving **all** of these relative references, the reactive
			 *      subscriptions don't propagate updates until after a new repeat
			 *      instance is added. A similar (but differently presenting) bug was
			 *      observed in @sadiqkhoja's demo earlier today. Both (for different
			 *      reasons) _at least partially_ implicate the need to resolve multiple
			 *      nodes in `getSubscribableDependencyByReference` (or whatever may
			 *      evolve in its place/to support its current use cases).
			 */
			describe('select from repeat', () => {
				describe('when repeat added', () => {
					// Unlike static secondary instances, repeats are dynamic. Repeat instances (items) can be added or removed. The
					// contents of those instances (item values, labels) can also change.
					it.fails('updates choices', async () => {
						const scenario = await Scenario.init('Select from repeat', getSelectFromRepeatForm());

						scenario.answer('/data/repeat[1]/value', 'a');
						scenario.answer('/data/repeat[1]/label', 'A');
						expect(scenario.choicesOf('/data/select')).toContainChoices([choice('a', 'A')]);

						scenario.answer('/data/repeat[2]/value', 'b');
						scenario.answer('/data/repeat[2]/label', 'B');
						expect(scenario.choicesOf('/data/select')).toContainChoicesInAnyOrder([
							choice('a', 'A'),
							choice('b', 'B'),
						]);
					});
				});

				describe('when repeat changed', () => {
					it.fails('updates choices', async () => {
						const scenario = await Scenario.init('Select from repeat', getSelectFromRepeatForm());

						scenario.answer('/data/repeat[1]/value', 'a');
						scenario.answer('/data/repeat[1]/label', 'A');

						expect(scenario.choicesOf('/data/select')).toContainChoices([choice('a', 'A')]);

						scenario.answer('/data/repeat[1]/value', 'c');
						scenario.answer('/data/repeat[1]/label', 'C');

						expect(scenario.choicesOf('/data/select')).toContainChoices([choice('c', 'C')]);
						expect(scenario.choicesOf('/data/select').size()).toBe(1);
					});
				});

				describe('when repeat removed', () => {
					it.fails('updates choices', async () => {
						const scenario = await Scenario.init('Select from repeat', getSelectFromRepeatForm());

						scenario.answer('/data/repeat[1]/value', 'a');
						scenario.answer('/data/repeat[1]/label', 'A');

						expect(scenario.choicesOf('/data/select')).toContainChoices([choice('a', 'A')]);

						scenario.removeRepeat('/data/repeat[1]');

						expect(scenario.choicesOf('/data/select').size()).toBe(0);
					});
				});

				describe('with predicate', () => {
					describe('when predicate trigger changes', () => {
						it.fails('updates choices', async () => {
							const scenario = await Scenario.init(
								'Select from repeat',
								getSelectFromRepeatForm('starts-with(value,current()/../filter)')
							);

							scenario.answer('/data/repeat[1]/value', 'a');
							scenario.answer('/data/repeat[1]/label', 'A');
							scenario.answer('/data/filter', 'a');

							expect(scenario.choicesOf('/data/select')).toContainChoices([choice('a', 'A')]);

							scenario.answer('/data/filter', 'b');

							expect(scenario.choicesOf('/data/select').size()).toBe(0);
						});
					});
				});
			});
		}
	);
});

describe.todo('SelectOneChoiceFilterTest.java');
describe.todo('SelectMultipleChoiceFilterTest.java');
