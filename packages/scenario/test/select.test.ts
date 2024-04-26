import {
	bind,
	body,
	head,
	html,
	input,
	instance,
	item,
	label,
	mainInstance,
	model,
	repeat,
	select1,
	select1Dynamic,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { choice } from '../src/choice/ExpectedChoice.ts';
import { Scenario } from '../src/jr/Scenario.ts';

// Ported as of https://github.com/getodk/javarosa/commit/5ae68946c47419b83e7d28290132d846e457eea6
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

	/**
	 * **PORTING NOTES**
	 *
	 * 1. JavaRosa's name for this test (`multilanguage`) has been replaced with a
	 *    more idiomatic (BDD-ish) name suitable for a call to `it`.
	 *
	 * 2. The JavaRosa test implementation specifies itext ids for label text. Per
	 *    discussion in Slack, we've updated the test to assert the expected label
	 *    translation strings. The itext ids from the original test are currently
	 *    preserved as inline comments.
	 */
	it('translates select choice labels', async () => {
		const scenario = await Scenario.init(
			'Multilingual dynamic select',
			html(
				head(
					title('Multilingual dynamic select'),
					model(
						t(
							'itext',
							t(
								"translation lang='fr'",
								t("text id='choices-0'", t('value', 'A (fr)')),
								t("text id='choices-1'", t('value', 'B (fr)')),
								t("text id='choices-2'", t('value', 'C (fr)'))
							),
							t(
								"translation lang='en'",
								t("text id='choices-0'", t('value', 'A (en)')),
								t("text id='choices-1'", t('value', 'B (en)')),
								t("text id='choices-2'", t('value', 'C (en)'))
							)
						),
						mainInstance(t("data id='multilingual-select'", t('select'))),

						instance(
							'choices',
							t('item', t('itextId', 'choices-0'), t('name', 'a')),
							t('item', t('itextId', 'choices-1'), t('name', 'b')),
							t('item', t('itextId', 'choices-2'), t('name', 'c'))
						)
					)
				),
				body(
					select1Dynamic(
						'/data/select',
						"instance('choices')/root/item",
						'name',
						'jr:itext(itextId)'
					)
				)
			)
		);

		scenario.setLanguage('en');

		expect(scenario.choicesOf('/data/select').size()).toBe(3);

		expect(scenario.choicesOf('/data/select')).toContainChoicesInAnyOrder([
			choice('a', /* choices-0 */ 'A (en)'),
			choice('b', /* choices-1 */ 'B (en)'),
			choice('c', /* choices-2 */ 'C (en)'),
		]);
	});

	describe('Select with changed triggers', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * The last assertion is a reference check, which will always return true in
		 * our {@link Scenario} implementation! This seems to be intended to
		 * exercise an implementation detail to validate recomputation.
		 *
		 * An alternate implementation of the same test follows, exercising **two
		 * recomputations:**
		 *
		 * 1. Applying a different filter, to assert recomputation by checking that
		 *    the available choices changed.
		 *
		 * 2. Restoring the original fitler, to assert recomputation does restore
		 *    the originally available choices. (This is still testing a slightly
		 *    different case than the original JavaRosa test, but seems both worth
		 *    testing and a bit closer to the original test's intent).
		 */
		it('recomputes [the] choice list', async () => {
			const scenario = await Scenario.init(
				'Select',
				html(
					head(
						title('Select'),
						model(
							mainInstance(t("data id='select'", t('filter'), t('select'))),

							instance(
								'choices',
								item('aa', 'A'),
								item('aaa', 'AA'),
								item('bb', 'B'),
								item('bbb', 'BB')
							)
						)
					),
					body(
						input('/data/filter'),
						select1Dynamic(
							'/data/select',
							"instance('choices')/root/item[starts-with(value,/data/filter)]"
						)
					)
				)
			);

			scenario.answer('/data/filter', 'a');

			const choices = scenario.choicesOf('/data/select');

			expect(choices).toContainChoicesInAnyOrder([choice('aa', 'A'), choice('aaa', 'AA')]);

			scenario.answer('/data/filter', 'aa');

			expect(choices).toContainChoicesInAnyOrder([choice('aa', 'A'), choice('aaa', 'AA')]);

			// Even though the list happens to be unchanged, it should have been recomputed because the trigger value changed
			expect(scenario.choicesOf('/data/select')).not.toBe(choices);
		});

		it('recomputes the choice list (alt)', async () => {
			const scenario = await Scenario.init(
				'Select',
				html(
					head(
						title('Select'),
						model(
							mainInstance(t("data id='select'", t('filter'), t('select'))),

							instance(
								'choices',
								item('aa', 'A'),
								item('aaa', 'AA'),
								item('bb', 'B'),
								item('bbb', 'BB')
							)
						)
					),
					body(
						input('/data/filter'),
						select1Dynamic(
							'/data/select',
							"instance('choices')/root/item[starts-with(value,/data/filter)]"
						)
					)
				)
			);

			scenario.answer('/data/filter', 'a');

			let choices = scenario.choicesOf('/data/select');

			expect(choices).toContainChoicesInAnyOrder([choice('aa', 'A'), choice('aaa', 'AA')]);

			expect(choices).not.toContainChoicesInAnyOrder([choice('bb', 'B'), choice('bbb', 'BB')]);

			scenario.answer('/data/filter', 'b');

			choices = scenario.choicesOf('/data/select');

			expect(choices).not.toContainChoicesInAnyOrder([choice('aa', 'A'), choice('aaa', 'AA')]);

			expect(choices).toContainChoicesInAnyOrder([choice('bb', 'B'), choice('bbb', 'BB')]);

			scenario.answer('/data/filter', 'a');

			choices = scenario.choicesOf('/data/select');

			expect(choices).toContainChoicesInAnyOrder([choice('aa', 'A'), choice('aaa', 'AA')]);

			expect(choices).not.toContainChoicesInAnyOrder([choice('bb', 'B'), choice('bbb', 'BB')]);
		});
	});

	/**
	 * **PORTING NOTES**
	 *
	 * This currently fails because repeat-based itemsets are broken more
	 * generally. As with the above sub-suite, the last assertion is a reference
	 * check and will always pass. Once repeat-based itemsets are fixed, we'll
	 * want to consider whether this test should be implemented differently too.
	 */
	describe('select with repeat as trigger', () => {
		it.fails('recomputes [the] choice list at every request', async () => {
			const scenario = await Scenario.init(
				'Select with repeat trigger',
				html(
					head(
						title('Repeat trigger'),
						model(
							mainInstance(t("data id='repeat-trigger'", t('repeat', t('question')), t('select'))),

							instance('choices', item('1', 'A'), item('2', 'AA'), item('3', 'B'), item('4', 'BB'))
						)
					),
					body(
						repeat('/data/repeat', input('/data/repeat/question')),
						select1Dynamic(
							'/data/select',
							"instance('choices')/root/item[value>count(/data/repeat)]"
						)
					)
				)
			);

			scenario.answer('/data/repeat[1]/question', 'a');

			expect(scenario.choicesOf('/data/select').size()).toBe(3);

			scenario.answer('/data/repeat[2]/question', 'b');

			const choices = scenario.choicesOf('/data/select');

			expect(choices.size()).toBe(2);

			// Because of the repeat trigger in the count expression, choices should be recomputed every time they're requested
			expect(scenario.choicesOf('/data/select')).not.toBe(choices);
		});
	});

	//region Caching for selects in repeat
	// When a dynamic select is in a repeat, the itemsets for all repeat instances are represented by the same ItemsetBinding.
	describe('select in repeat', () => {
		describe('with ref to repeat child in predicate', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * This test again asserts a reference check. It seems likely that the
			 * test is otherwise valid without that check.
			 *
			 * Once again, the current failure is likely related to repeat-based
			 * itemsets being broken in general.
			 */
			it.fails('evaluates [the] choice list for each repeat instance', async () => {
				const scenario = await Scenario.init(
					'Select in repeat',
					html(
						head(
							title('Select in repeat'),
							model(
								mainInstance(t("data id='repeat-select'", t('repeat', t('filter'), t('select')))),

								instance(
									'choices',
									item('a', 'A'),
									item('aa', 'AA'),
									item('b', 'B'),
									item('bb', 'BB')
								)
							)
						),
						body(
							repeat(
								'/data/repeat',
								input('filter'),
								select1Dynamic(
									'/data/repeat/select',
									"instance('choices')/root/item[starts-with(value,current()/../filter)]"
								)
							)
						)
					)
				);

				scenario.answer('/data/repeat[1]/filter', 'a');
				scenario.answer('/data/repeat[2]/filter', 'a');

				const repeat0Choices = scenario.choicesOf('/data/repeat[1]/select');
				const repeat1Choices = scenario.choicesOf('/data/repeat[2]/select');

				// The trigger keys are /data/repeat[1]/filter and /data/repeat[2]/filter which means no caching between them
				expect(repeat0Choices).not.toBe(repeat1Choices);

				scenario.answer('/data/repeat[2]/filter', 'bb');

				expect(scenario.choicesOf('/data/repeat[1]/select').size()).toBe(2);
				expect(scenario.choicesOf('/data/repeat[2]/select').size()).toBe(1);
			});
		});
	});
});

/**
 * **PORTING NOTES**
 *
 * Similar to `PredicateCachingTest.java`, for now we've skipped tests which
 * only assert the expected number of evaluations, and we've ported the
 * remaining tests which have apparent correctness concerns.
 */
describe('SelectCachingTest.java', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * I've done my best here to intuit the intent of the test name from JavaRosa.
	 * It originally seemed that the test names may be back-referencing previous
	 * tests in source order, but it now seems like the `and` and `or` parts of
	 * the name reference the behavior of those operators in XPath expressions
	 * under test.
	 */
	describe('`and` of two eq choice filters', () => {
		it('is not confused with `or`', async () => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(t('data id="some-form"', t('choice'), t('select1'), t('select2'))),
							instance('instance', item('a', 'A'), item('b', 'B')),
							bind('/data/choice').type('string'),
							bind('/data/select1').type('string'),
							bind('/data/select2').type('string')
						)
					),
					body(
						input('/data/choice'),
						select1Dynamic(
							'/data/select1',
							"instance('instance')/root/item[value=/data/choice or value!=/data/choice]"
						),
						select1Dynamic(
							'/data/select2',
							"instance('instance')/root/item[value=/data/choice and value!=/data/choice]"
						)
					)
				)
			);

			scenario.answer('/data/choice', 'a');

			expect(scenario.choicesOf('/data/select1').size()).toBe(2);
			expect(scenario.choicesOf('/data/select2').size()).toBe(0);
		});
	});

	describe('nested predicates', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * Rephrase?
		 */
		it('[is] are correct after form state changes', async () => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(t('data id="some-form"', t('choice'), t('other_choice'), t('select'))),
							instance('instance', item('a', 'A'), item('b', 'B')),
							bind('/data/choice').type('string'),
							bind('/data/other_choice').type('string'),
							bind('/data/select').type('string')
						)
					),
					body(
						input('/data/choice'),
						input('/data/other_choice'),
						select1Dynamic(
							'/data/select',
							"instance('instance')/root/item[value=/data/choice][value=/data/other_choice]"
						)
					)
				)
			);

			scenario.answer('/data/choice', 'a');
			scenario.answer('/data/other_choice', 'a');

			expect(scenario.choicesOf('/data/select').size()).toBe(1);

			scenario.answer('/data/other_choice', 'b');

			expect(scenario.choicesOf('/data/select').size()).toBe(0);
		});
	});

	it('eq choice filters for ints work', async () => {
		const scenario = await Scenario.init(
			'Some form',
			html(
				head(
					title('Some form'),
					model(
						mainInstance(t('data id="some-form"', t('choice'), t('select'))),
						instance('instance', item('1', 'One'), item('2', 'Two')),
						bind('/data/choice').type('int'),
						bind('/data/select').type('string')
					)
				),
				body(
					input('/data/choice'),
					select1Dynamic('/data/select', "instance('instance')/root/item[value=/data/choice]")
				)
			)
		);

		scenario.answer('/data/choice', 1);

		expect(scenario.choicesOf('/data/select').size()).toBe(1);
	});
});

describe('SelectChoiceTest.java', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * This test is select-specific, and comes from a select-specific JavaRosa
	 * file (er "bag"/"vat" 😂 @lognaturel), but falls into the same category as
	 * those from `FormDefSerializationTest.java` (also skipped in
	 * {@link ./serialization.test.ts}).
	 */
	it.skip('value_should_continue_being_an_empty_string_after_deserialization', async () => {
		const scenario = await Scenario.init(
			'SelectChoice.getValue() regression test form',
			html(
				head(
					title('SelectChoice.getValue() regression test form'),
					model(
						mainInstance(t('data id="some-form"', t('the-choice'))),
						bind('/data/the-choice').type('string').required()
					)
				),
				body(select1('/data/the-choice', label('Select one choice'), item('', 'Empty value')))
			)
		);

		scenario.next('/data/the-choice');

		expect(scenario.getQuestionAtIndex('select').getChoice(0).getValue()).toBe('');

		const deserializedScenario = await scenario.serializeAndDeserializeForm();

		await deserializedScenario.newInstance();

		deserializedScenario.next('/data/the-choice');

		expect(deserializedScenario.getQuestionAtIndex('select').getChoice(0).getValue()).toBe('');
	});
});

describe.todo('SelectOneChoiceFilterTest.java');
describe.todo('SelectMultipleChoiceFilterTest.java');
