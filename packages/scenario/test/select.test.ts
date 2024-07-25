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
import { answerText } from '../src/answer/ExpectedDisplayTextAnswer.ts';
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';
import { choice } from '../src/choice/ExpectedChoice.ts';
import type { ExplicitRepeatCreationOptions } from '../src/jr/Scenario.ts';
import { Scenario } from '../src/jr/Scenario.ts';
import type { PositionalEvent } from '../src/jr/event/PositionalEvent.ts';
import { setUpSimpleReferenceManager } from '../src/jr/reference/ReferenceManagerTestUtils.ts';
import { r } from '../src/jr/resource/ResourcePathHelper.ts';
import type { SelectChoice } from '../src/jr/select/SelectChoice.ts';
import { ANSWER_REQUIRED_BUT_EMPTY } from '../src/jr/validation/ValidateOutcome.ts';
import { nullValue } from '../src/value/ExpectedNullValue.ts';

// Ported as of https://github.com/getodk/javarosa/commit/5ae68946c47419b83e7d28290132d846e457eea6
describe('DynamicSelectUpdateTest.java', () => {
	const getSelectFromRepeatForm = (predicate = '') => {
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
				repeat('/data/repeat', input('value'), input('label')),
				input('filter'),
				select1Dynamic('/data/select', '../repeat' + (predicate !== '' ? `[${predicate}]` : ''))
			)
		);
	};

	/**
	 * **PORTING NOTES**
	 *
	 * The below reference to `XPathFuncExprRandomizeTest` in JavaRosa is meant
	 * to reference `RandomizeTest`.
	 *
	 * - - -
	 *
	 * JR:
	 *
	 * Integration tests to verify that the choice lists for "dynamic selects"
	 * (selects with itemsets rather than inline items) are updated when dependent
	 * values change.
	 *
	 * See also:
	 * - {@see SelectOneChoiceFilterTest}
	 * - {@see SelectMultipleChoiceFilterTest} for coverage of dynamic select
	 *   multiples
	 * - {@see XPathFuncExprRandomizeTest} for coverage of choice list updates
	 *   when randomization is specified
	 *
	 */
	describe('select from repeat', () => {
		describe('when repeat added', () => {
			// Unlike static secondary instances, repeats are dynamic. Repeat instances (items) can be added or removed. The
			// contents of those instances (item values, labels) can also change.
			it('updates choices', async () => {
				const scenario = await Scenario.init('Select from repeat', getSelectFromRepeatForm());

				scenario.answer('/data/repeat[1]/value', 'a');
				scenario.answer('/data/repeat[1]/label', 'A');
				expect(scenario.choicesOf('/data/select')).toContainChoices([choice('a', 'A')]);

				scenario.proposed_addExplicitCreateNewRepeatCallHere('/data/repeat', {
					explicitRepeatCreation: true,
				});

				scenario.answer('/data/repeat[2]/value', 'b');
				scenario.answer('/data/repeat[2]/label', 'B');
				expect(scenario.choicesOf('/data/select')).toContainChoicesInAnyOrder([
					choice('a', 'A'),
					choice('b', 'B'),
				]);
			});
		});

		describe('when repeat changed', () => {
			it('updates choices', async () => {
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
			it('updates choices', async () => {
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
				it('updates choices', async () => {
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
		 * 2. Restoring the original filter, to assert recomputation does restore
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

	describe('select with repeat as trigger', () => {
		describe.each<ExplicitRepeatCreationOptions>([
			{ explicitRepeatCreation: false },
			{ explicitRepeatCreation: true },
		])('explicit repeat creation: $explicitRepeatCreation', ({ explicitRepeatCreation }) => {
			let testFn: typeof it | typeof it.fails;

			if (explicitRepeatCreation) {
				testFn = it;
			} else {
				testFn = it.fails;
			}

			testFn('recomputes [the] choice list at every request', async () => {
				const scenario = await Scenario.init(
					'Select with repeat trigger',
					html(
						head(
							title('Repeat trigger'),
							model(
								mainInstance(
									t("data id='repeat-trigger'", t('repeat', t('question')), t('select'))
								),

								instance(
									'choices',
									item('1', 'A'),
									item('2', 'AA'),
									item('3', 'B'),
									item('4', 'BB')
								)
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

				scenario.proposed_addExplicitCreateNewRepeatCallHere('/data/repeat', {
					explicitRepeatCreation,
				});

				scenario.answer('/data/repeat[2]/question', 'b');

				const choices = scenario.choicesOf('/data/select');

				expect(choices.size()).toBe(2);

				// Because of the repeat trigger in the count expression, choices should be recomputed every time they're requested
				expect(scenario.choicesOf('/data/select')).not.toBe(choices);
			});
		});
	});

	//region Caching for selects in repeat
	// When a dynamic select is in a repeat, the itemsets for all repeat instances are represented by the same ItemsetBinding.
	describe('select in repeat', () => {
		describe('with ref to repeat child in predicate', () => {
			it('evaluates [the] choice list for each repeat instance', async () => {
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

				scenario.proposed_addExplicitCreateNewRepeatCallHere('/data/repeat', {
					explicitRepeatCreation: true,
				});

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

	/**
	 * **PORTING NOTES**
	 *
	 * The tests in this sub-suite are currently blocked by several absent features:
	 *
	 * 1. Retrieving external secondary instance resources
	 * 2. Support for external secondary instance resources when evaluating
	 *    XPath expressions referencing them
	 * 3. Any notion of engine API access to the well-known GeoJSON `geometry`
	 *    property, or any other arbitrary named child nodes present in any
	 *    secondary instance (whether external or otherwise)
	 */
	describe('`getChild`', () => {
		it.fails('returns named child when choices are from secondary instance', async () => {
			setUpSimpleReferenceManager(r('external-select-geojson.xml').getParent(), 'file');

			const scenario = await Scenario.init('external-select-geojson.xml');

			expect(scenario.choicesOf('/data/q').get(1)?.getChild('geometry')).toBe('0.5 104 0 0');
			expect(scenario.choicesOf('/data/q').get(1)?.getChild('special-property')).toBe(
				'special value'
			);
		});

		it.fails(
			'returns null when choices are from secondary instance and requested child does not exist',
			async () => {
				setUpSimpleReferenceManager(r('external-select-geojson.xml').getParent(), 'file');

				const scenario = await Scenario.init('external-select-geojson.xml');

				expect(scenario.choicesOf('/data/q').get(1)?.getChild('non-existent')).toBe(null);
			}
		);

		it.fails(
			'returns empty string when choices are from secondary instance and requested child has no value',
			async () => {
				const scenario = await Scenario.init(
					'Select with empty value',
					html(
						head(
							title('Select with empty value'),
							model(
								mainInstance(t("data id='select-empty'", t('select'))),
								instance('choices', t('item', t('label', 'Item'), t('property', '')))
							)
						),
						body(select1Dynamic('/data/select', "instance('choices')/root/item", 'name', 'label'))
					)
				);

				expect(scenario.choicesOf('/data/select').get(0)?.getChild('property')).toBe('');
			}
		);

		/**
		 * **PORTING NOTES**
		 *
		 * This test is also blocked on lack of support for repeat-based itemsets.
		 */
		it.fails('updates when choices are from repeat', async () => {
			const scenario = await Scenario.init(
				'Select from repeat',
				html(
					head(
						title('Select from repeat'),
						model(
							mainInstance(
								t(
									"data id='repeat-select'",
									t('repeat', t('value'), t('label'), t('special-property')),
									t('filter'),
									t('select')
								)
							)
						)
					),
					body(
						repeat('/data/repeat', input('value'), input('label'), input('special-property')),
						input('filter'),
						select1Dynamic('/data/select', '../repeat')
					)
				)
			);
			scenario.answer('/data/repeat[0]/value', 'a');
			scenario.answer('/data/repeat[0]/label', 'A');
			scenario.answer('/data/repeat[0]/special-property', 'AA');

			expect(scenario.choicesOf('/data/select').get(0)?.getValue()).toBe('a');
			expect(scenario.choicesOf('/data/select').get(0)?.getChild('special-property')).toBe('AA');

			scenario.answer('/data/repeat[0]/special-property', 'changed');

			expect(scenario.choicesOf('/data/select').get(0)?.getChild('special-property')).toBe(
				'changed'
			);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * In theory, this could be made to pass! It makes more sense to fail it
		 * with the same error as the others above, as it is also subject to the
		 * same API design considerations. It also may be moot depending on our
		 * posture towards inline select items generally.
		 */
		it.fails('returns null when called on a choice from [an] inline select', async () => {
			const scenario = await Scenario.init(
				'Static select',
				html(
					head(
						title('Static select'),
						model(mainInstance(t("data id='static-select'", t('select'))))
					),
					body(select1('/data/select', item('one', 'One'), item('two', 'Two')))
				)
			);

			expect(scenario.choicesOf('/data/select').get(0)?.getChild('invalid-property')).toBe(
				nullValue()
			);
		});
	});

	/**
	 * **PORTING NOTES**
	 *
	 * It is already obvious at the outset that this API will fall into the same
	 * category as `getChild` above. Minimal effort has gone into porting these.
	 * Any further notes that might arise will come from further analysis when the
	 * affected functionality is prioritized.
	 */
	describe('`getAdditionalChildren`', () => {
		it.fails('returns children in order when choices are from secondary instance', async () => {
			setUpSimpleReferenceManager(r('external-select-geojson.xml').getParent(), 'file');

			const scenario = await Scenario.init('external-select-geojson.xml');

			const firstNodeChildren = scenario.choicesOf('/data/q').get(0)?.getAdditionalChildren();

			expect(firstNodeChildren?.size()).toBe(3);
			expect(firstNodeChildren?.get(0)).toEqual(['geometry', '0.5 102 0 0']);
			expect(firstNodeChildren?.get(1)).toEqual(['id', 'fs87b']);
			expect(firstNodeChildren?.get(2)).toEqual(['foo', 'bar']);

			const secondNodeChildren = scenario.choicesOf('/data/q').get(1)?.getAdditionalChildren();

			expect(secondNodeChildren?.size()).toBe(4);
			expect(secondNodeChildren?.get(0)).toEqual(['geometry', '0.5 104 0 0']);
			expect(secondNodeChildren?.get(1)).toEqual(['id', '67']);
			expect(secondNodeChildren?.get(2)).toEqual(['foo', 'quux']);
			expect(secondNodeChildren?.get(3)).toEqual(['special-property', 'special value']);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * The corresponding JavaRosa test name begins with `getChildren`, which seems
		 * to be a typo (or surprising shorthand) for `getAdditionalChildren
		 */
		it.fails('updates when choices are from repeat', async () => {
			const scenario = await Scenario.init(
				'Select from repeat',
				html(
					head(
						title('Select from repeat'),
						model(
							mainInstance(
								t(
									"data id='repeat-select'",
									t('repeat', t('value'), t('label'), t('special-property')),
									t('filter'),
									t('select')
								)
							)
						)
					),
					body(
						repeat('/data/repeat', input('value'), input('label'), input('special-property')),
						input('filter'),
						select1Dynamic('/data/select', '../repeat')
					)
				)
			);
			scenario.answer('/data/repeat[0]/value', 'a');
			scenario.answer('/data/repeat[0]/label', 'A');
			scenario.answer('/data/repeat[0]/special-property', 'AA');

			expect(scenario.choicesOf('/data/select').get(0)?.getValue()).toBe('a');

			let children = scenario.choicesOf('/data/select').get(0)?.getAdditionalChildren();

			expect(children?.size()).toBe(2);
			expect(children?.get(0)).toEqual(['value', 'a']);
			expect(children?.get(1)).toEqual(['special-property', 'AA']);

			scenario.answer('/data/repeat[0]/special-property', 'changed');

			children = scenario.choicesOf('/data/select').get(0)?.getAdditionalChildren();

			expect(children?.get(1)).toEqual(['special-property', 'changed']);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * Like the inline (non-itemset) select test for `getChild`, this could be
		 * made to pass, but was left failing with the rest of the sub-suite based
		 * on the same reasoning.
		 */
		it.fails('returns empty when called on a choice from inline select', async () => {
			const scenario = await Scenario.init(
				'Static select',
				html(
					head(
						title('Static select'),
						model(mainInstance(t("data id='static-select'", t('select'))))
					),
					body(select1('/data/select', item('one', 'One'), item('two', 'Two')))
				)
			);

			expect(scenario.choicesOf('/data/select').get(0)?.getAdditionalChildren().isEmpty()).toBe(
				true
			);
		});
	});
});

/**
 * **PORTING NOTES**
 *
 * In JavaRosa, the corresponding test "vat" creates a new {@link Scenario}
 * instance as setup before each test. Per discussion in review, we have inlined
 * that setup at the start of each affected test, as the setup usage was an
 * unnecessary indirection.
 *
 * Also in JavaRosa, each test then begins by calling
 * {@link Scenario.newInstance | `scenario.newInstance`}. It isn't clear whether
 * those calls are superfluous **there**, but they would be here (if we
 * supported that `Scenario` method, which we have currently deferred). Per PR
 * discussion, those calls have been removed.
 *
 * - - -
 *
 * JR:
 *
 * When itemsets are dynamically generated, the choices available to a user in a
 * select multiple question can change based on the answers given to other
 * questions. These tests verify that when several select multiples are chained
 * in a cascading pattern, updating selections at root levels correctly updates
 * the choices available in dependent selects all the way down the cascade. They
 * also verify that if an answer that is no longer part of the available choices
 * was previously selected, that selection is removed from the answer.
 *
 * Select ones use the same code paths so see also
 * {@link SelectOneChoiceFilterTest} for more explicit cases at each level.
 */
describe('SelectMultipleChoiceFilterTest.java', () => {
	describe('dependent levels in blank instance', () => {
		it(`[has] have no choices`, async () => {
			const scenario = await Scenario.init('three-level-cascading-multi-select.xml');

			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);
			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);
		});
	});

	describe('selecting value at level 1', () => {
		it('filters choices at level 2', async () => {
			const scenario = await Scenario.init('three-level-cascading-multi-select.xml');

			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);

			scenario.answer('/data/level1', 'a', 'b');

			expect(scenario.choicesOf('/data/level2')).toContainChoicesInAnyOrder([
				choice('aa'),
				choice('ab'),
				choice('ac'),
				choice('ba'),
				choice('bb'),
				choice('bc'),
			]);
		});
	});

	describe('selecting values at levels 1 and 2', () => {
		it('filters choices at level 3', async () => {
			const scenario = await Scenario.init('three-level-cascading-multi-select.xml');

			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);
			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);

			scenario.answer('/data/level1', 'a', 'b');
			scenario.answer('/data/level2', 'aa', 'ba');

			expect(scenario.choicesOf('/data/level3')).toContainChoicesInAnyOrder([
				choice('aaa'),
				choice('aab'),
				choice('baa'),
				choice('bab'),
			]);
		});
	});

	describe('new choice filter evaluation', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * Failure appears to be a bug where selection state is (partially) lost
		 * when changing an itemset filter updates the select's available items.
		 * Similar behavior can be observed on simpler forms, including at least one
		 * fixture previously derived from Enketo. This also appears to be at least
		 * partly related to deferring a decision on the appropriate behavior for
		 * the effect itemset filtering should have on selection state **when it is
		 * changed and then reverted**
		 * ({@link https://github.com/getodk/web-forms/issues/57}).
		 */
		// JR: removesIrrelevantAnswersAtAllLevels_withoutChangingOrder
		it.fails(
			'removes predicate-filtered answers at all levels, without changing order',
			async () => {
				const scenario = await Scenario.init('three-level-cascading-multi-select.xml');

				expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);
				expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);

				scenario.answer('/data/level1', 'a', 'b', 'c');
				scenario.answer('/data/level2', 'aa', 'ba', 'ca');
				scenario.answer('/data/level3', 'aab', 'baa', 'aaa');

				// Remove b from the level1 answer; this should filter out b-related answers and choices at levels 2 and 3
				scenario.answer('/data/level1', 'a', 'c');

				// Force populateDynamicChoices to run again which is what filters out irrelevant answers
				scenario.choicesOf('/data/level2');

				expect(scenario.answerOf('/data/level2')).toEqualAnswer(answerText('aa, ca'));

				// This also runs populateDynamicChoices and filters out irrelevant answers
				expect(scenario.choicesOf('/data/level3')).toContainChoices([
					choice('aaa'),
					choice('aab'),
					choice('caa'),
					choice('cab'),
				]);

				expect(scenario.answerOf('/data/level3')).toEqualAnswer(answerText('aab, aaa'));
			}
		);

		it('leaves answer unchanged if all selections still in choices', async () => {
			const scenario = await Scenario.init('three-level-cascading-multi-select.xml');

			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);
			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);

			scenario.answer('/data/level1', 'a', 'b', 'c');
			scenario.answer('/data/level2', 'aa', 'ba', 'bb', 'ab');
			scenario.answer('/data/level3', 'aab', 'baa', 'aaa');

			// Remove c from the level1 answer; this should have no effect on levels 2 and 3
			scenario.answer('/data/level1', 'a', 'b');

			// Force populateDynamicChoices to run again which is what filters out irrelevant answers
			scenario.choicesOf('/data/level2');

			expect(scenario.answerOf('/data/level2')).toEqualAnswer(answerText('aa, ba, bb, ab'));

			// This also runs populateDynamicChoices and filters out irrelevant answers
			expect(scenario.choicesOf('/data/level3')).toContainChoicesInAnyOrder([
				choice('aaa'),
				choice('aab'),
				choice('baa'),
				choice('bab'),
			]);

			expect(scenario.answerOf('/data/level3')).toEqualAnswer(answerText('aab, baa, aaa'));
		});
	});
});

/**
 * **PORTING NOTES**
 *
 * At first glance, this looks like it will probably follow a very similar
 * pattern to `SelectMultipleChoiceFilterTest.java` (unsurprising given the
 * parallel naming).
 *
 * Similarly to that suite, each `Scenario` setup has been inlined and each
 * call to `newInstance` has been removed.
 *
 * - - -
 *
 * JR:
 *
 * When itemsets are dynamically generated, the choices available to a user in a
 * select one question can change based on the answers given to other questions.
 * These tests verify that when several select ones are chained in a cascading
 * pattern, updating selections at root levels correctly updates the choices
 * available in dependent selects all the way down the cascade. They also verify
 * that if an answer that is no longer part of the available choices was
 * previously selected, that answer is cleared.
 */
describe('SelectOneChoiceFilterTest.java', () => {
	describe('dependent levels in blank instance', () => {
		it('should have no choices', async () => {
			const scenario = await Scenario.init('three-level-cascading-select.xml');

			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);
			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);
		});
	});

	describe('selecting value at level 1', () => {
		it('should filter choices at level 2', async () => {
			const scenario = await Scenario.init('three-level-cascading-select.xml');

			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);

			scenario.answer('/data/level1', 'b');

			expect(scenario.choicesOf('/data/level2')).toContainChoicesInAnyOrder([
				choice('ba'),
				choice('bb'),
				choice('bc'),
			]);
		});
	});

	describe('selecting values at levels 1 and 2', () => {
		it('should filter choices at level 3', async () => {
			const scenario = await Scenario.init('three-level-cascading-select.xml');

			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);
			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);

			scenario.answer('/data/level1', 'b');
			scenario.answer('/data/level2', 'ba');

			expect(scenario.choicesOf('/data/level3')).toContainChoicesInAnyOrder([
				choice('baa'),
				choice('bab'),
			]);
		});
	});

	describe('clearing value at level 2', () => {
		it('should clear choices at level 3', async () => {
			const scenario = await Scenario.init('three-level-cascading-select.xml');

			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);
			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);

			scenario.answer('/data/level1', 'a');
			scenario.answer('/data/level2', 'aa');

			expect(scenario.choicesOf('/data/level3')).toContainChoicesInAnyOrder([
				choice('aaa'),
				choice('aab'),
			]);

			scenario.answer('/data/level2', '');

			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);
		});
	});

	/**
	 * **PORTING NOTES**
	 *
	 * As with some prior tests, assertions that an answer will be a `nullValue()`
	 * are treated as equivalent to asserting that the question's answer value is
	 * blank/empty string.
	 */
	describe('clearing value at level 1', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * Failure likely rooted in incomplete behavior, deferred to
		 * {@link https://github.com/getodk/web-forms/issues/57}.
		 *
		 * @todo If we ultimately decide to restore selections under (some)
		 * circumstances like those described in the linked issue, this may be a
		 * good place to add a supplemental test exercising that.
		 */
		it.fails('should clear choices at levels 2 and 3', async () => {
			const scenario = await Scenario.init('three-level-cascading-select.xml');

			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);
			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);

			scenario.answer('/data/level1', 'a');
			scenario.answer('/data/level2', 'aa');

			expect(scenario.choicesOf('/data/level3')).toContainChoicesInAnyOrder([
				choice('aaa'),
				choice('aab'),
			]);

			scenario.answer('/data/level1', '');

			expect(scenario.choicesOf('/data/level2').isEmpty()).toBe(true);

			// this next assertion is only true because the one before called populateDynamic choices
			// TODO (JR): make clearing out answers that are no longer available choices part of the form re-evaluation
			// assertThat(scenario.answerOf("/data/level2"), nullValue());
			expect(scenario.answerOf('/data/level2').getValue()).toBe('');
			expect(scenario.choicesOf('/data/level3').isEmpty()).toBe(true);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * This test is clearly a valuable exercise of `required` validation logic,
		 * but it seems tangential to the description.
		 *
		 * A supplemental test is added below, exercising the checks for cleared
		 * values independent of the validation checks.
		 *
		 * This test currently fails pending full support for updating select nodes'
		 * selection values when their itemset options are filtered.
		 *
		 * The validation assertions have been (temporarily?) refined to check only
		 * the **reference** of expected invalid nodes, rather than comparing to the
		 * full node object. This is necessary to prevent slow and expensive logging
		 * of the full node structure (really the full instance tree, as the nodes
		 * reference `root`) on assertion failure. The original assertions are left
		 * commented out, so they can be restored when the test passes.
		 */
		it.fails('should clear [and validate] values at levels 2 and 3', async () => {
			const scenario = await Scenario.init('three-level-cascading-select.xml');

			expect(scenario.answerOf('/data/level2').getValue()).toBe('');
			expect(scenario.answerOf('/data/level3').getValue()).toBe('');

			scenario.answer('/data/level1', 'a');
			scenario.answer('/data/level2', 'aa');
			scenario.answer('/data/level3', 'aab');

			scenario.answer('/data/level1', '');

			let validate = scenario.getValidationOutcome();

			// expect(validate.failedPrompt).toBe(scenario.indexOf('/data/level2'));
			expect(validate.failedPrompt?.node?.currentState.reference).toBe('/data/level2');
			expect(validate.outcome).toBe(ANSWER_REQUIRED_BUT_EMPTY);

			// If we set level2 to "aa", form validation passes. Currently, clearing a choice only updates filter expressions
			// that directly depend on it. With this form, we could force clearing the third level when the first level is cleared
			// by making the level3 filter expression in the form definition reference level1 AND level2.
			scenario.answer('/data/level1', 'b');
			scenario.answer('/data/level2', 'bb');

			validate = scenario.getValidationOutcome();

			// expect(validate.failedPrompt).toBe(scenario.indexOf('/data/level3'));
			expect(validate.failedPrompt?.node?.currentState.reference).toBe('/data/level3');
			expect(validate.outcome).toBe(ANSWER_REQUIRED_BUT_EMPTY);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * Meta-note: this test is **not** ported from JavaRosa, but supplemental to
		 * the ported test above. While misleading, reusing the heading is expected
		 * to be helpful in compiling notes for more comprehensive analysis,
		 * discussion, planning and prioritization once porting is complete.
		 *
		 * Actual note: this failure is almost certainly rooted in incomplete
		 * behavior, deferred to
		 * {@link https://github.com/getodk/web-forms/issues/57}.
		 */
		it.fails(
			'clears values at levels 2 and 3 [currently supplemental, see porting notes on previous teest]',
			async () => {
				const scenario = await Scenario.init('three-level-cascading-select.xml');

				expect(scenario.answerOf('/data/level2').getValue()).toBe('');
				expect(scenario.answerOf('/data/level3').getValue()).toBe('');

				scenario.answer('/data/level1', 'a');
				scenario.answer('/data/level2', 'aa');
				scenario.answer('/data/level3', 'aab');

				scenario.answer('/data/level1', '');

				expect(scenario.answerOf('/data/level2')).toEqualAnswer(stringAnswer(''));

				scenario.answer('/data/level1', 'b');
				scenario.answer('/data/level2', 'bb');

				expect(scenario.answerOf('/data/level3')).toEqualAnswer(stringAnswer(''));
			}
		);
	});

	describe('changing value at level 2', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * Failure likely rooted in incomplete behavior, deferred to
		 * {@link https://github.com/getodk/web-forms/issues/57}.
		 */
		it.fails('should clear level 3 if choice no longer available', async () => {
			const scenario = await Scenario.init('three-level-cascading-select.xml');

			scenario.answer('/data/level1_contains', 'a');
			scenario.answer('/data/level2_contains', 'aa');

			expect(scenario.choicesOf('/data/level3_contains')).toContainChoicesInAnyOrder([
				choice('aaa'),
				choice('aab'),
				choice('baa'),
			]);

			scenario.answer('/data/level3_contains', 'aaa');
			scenario.answer('/data/level2_contains', 'ab');

			expect(scenario.choicesOf('/data/level3_contains')).toContainChoicesInAnyOrder([
				choice('aab'),
				choice('bab'),
			]);

			// this next assertion is only true because the one before called populateDynamicChoices
			// TODO (JR): make clearing out answers that are no longer available choices part of the form re-evaluation
			// assertThat(scenario.answerOf("/data/level3_contains"), nullValue());
			expect(scenario.answerOf('/data/level3_contains').getValue()).toBe('');
		});

		/**
		 * **PORTING NOTES**
		 *
		 *
		 * Assertions calling {@link SelectChoice.getDisplayText} have been replaced
		 * with calls to {@link SelectChoice.getValue}. It's highly doubtful that
		 * they'd produce a meaningful difference, or that their semantic difference
		 * would be important for the behavior under test. Those calls are currently
		 * preserved (commented out) pending any further discussion on the topic.
		 */
		it('should not clear level 3 if choice still available', async () => {
			const scenario = await Scenario.init('three-level-cascading-select.xml');

			scenario.answer('/data/level1_contains', 'a');
			scenario.answer('/data/level2_contains', 'aa');

			expect(scenario.choicesOf('/data/level3_contains')).toContainChoicesInAnyOrder([
				choice('aaa'),
				choice('aab'),
				choice('baa'),
			]);

			scenario.answer('/data/level3_contains', 'aab');
			scenario.answer('/data/level2_contains', 'ab');

			// expect(scenario.answerOf('/data/level3_contains').getDisplayText()).toBe('aab');
			expect(scenario.answerOf('/data/level3_contains').getValue()).toBe('aab');

			// Since recomputing the choice list can change answers, verify it doesn't in this case
			expect(scenario.choicesOf('/data/level3_contains')).toContainChoicesInAnyOrder([
				choice('aab'),
				choice('bab'),
			]);

			// expect(scenario.answerOf('/data/level3_contains').getDisplayText()).toBe('aab');
			expect(scenario.answerOf('/data/level3_contains').getValue()).toBe('aab');
		});
	});
});

/**
 * **PORTING NOTES**
 *
 * These tests are concerned with select item (choice) labels, as described by
 * their leading `//region` comment in JavaRosa. Having clarified the intent of
 * the tests in a Slack discussion, it feels important to capture that here: the
 * (JavaRosa) APIs under test are specifically concerned with capturing the
 * label text corresponding to a select question's selected value; these APIs
 * are used for summary purposes, i.e. to show the human-readable text of an
 * answer, where that answer's value is associated with a select's item(s).
 * These APIs are also conceptually related to the `getDisplayText` method,
 * called by many other JavaRosa tests.
 *
 * In many _other cases_, tests calling that `getDisplayText` method are clearly
 * concerned with the respective questions' _value state_. In this case, the
 * tests are concerned both with the value state _and the label text
 * corresponding to that value_. As such, these tests are ported to preserve
 * that semantic distinction (rather than the general porting convention of
 * mapping such assertions to check the answers' values directly).
 *
 * Also from that Slack discussion, it is my belief at this point in the porting
 * effort that there may be a gap in coverage around select item/option labels
 * _more generally_. As such, each test in this "vat" is accompanied by a
 * supplemental test asserting **all of the available select items' labels**.
 *
 * In both cases, we introduce proposed API additions to {@link Scenario} (or
 * other APIs which we've treated as directly related to that interface, such as
 * {@link PositionalEvent} and its subclasses). These proposed additions either:
 *
 * - stand in for ported assertions (here preserved but commented out) with
 *   similar-but-internals-dependent semantics, or
 *
 * - provide additional semantics for supplemental tests where there isn't a
 *   known {@link Scenario}/related API equivalent.
 */
describe('FormEntryPromptTest.java', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * Rephrase?
	 */
	describe('//region Binding of select choice values to labels', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * Unwrap? This references a `FormEntryPrompt` method which is not otherwise
		 * referenced in the ported tests. It doesn't seem to provide much value
		 * other than what it'd provide by establishing that conceptual connection
		 * where it exists in JavaRosa.
		 */
		describe('`getSelectItemText`', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Rephrase? The term "selection" here refers to the _selected option_,
			 * and its value-as-represented-by-option-label. The name appears to be a
			 * reference to JavaRosa's internal `Selection` type, which deals with
			 * more than just the concept as it's referenced here. This may actually
			 * be a good colloquialism to adopt in common references to this concept!
			 * But it definitely feels like a term we should use with some intention,
			 * if so.
			 */
			describe('on selection[?] from dynamic[?] select', () => {
				describe('without translations', () => {
					/**
					 * **PORTING NOTES**
					 *
					 * Rephrase/clarify? It seems that "inner" text is a reference to the
					 * direct text content of a `<label>` (as opposed to a label's text as
					 * computed by `<label ref>`, typically with `jr:itext`). But:
					 *
					 * 1. This terminology is oddly XML/DOM-specific in its phrasing.
					 *
					 * 2. It's unclear if/how this concept of "inner text" interacts with
					 *    `<output>` as a potential child node within such a non-`ref`
					 *    label element.
					 *
					 * 3. The intent of the test seems to be the same, at least at first
					 *    blush, with the less specific "text". Ultimately that's what
					 *    this specific test is exercising. We'll want more nuance around
					 *    **formatted** labels/hints, but otherwise it seems pretty likely
					 *    we'll always want to test the actual text as produced
					 *    (regardless of its form definition structure).
					 */
					it('[gets?] returns label [~~]inner[~~] text', async () => {
						const scenario = await Scenario.init(
							'Select',
							html(
								head(
									title('Select'),
									model(
										mainInstance(t("data id='select'", t('filter'), t('select', 'a'))),

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
									input('/data/filter'),
									select1Dynamic(
										'/data/select',
										"instance('choices')/root/item[starts-with(value,/data/filter)]"
									)
								)
							)
						);

						scenario.next('/data/filter');
						scenario.answer('a');

						scenario.next('/data/select');

						// FormEntryPrompt questionPrompt = scenario.getFormEntryPromptAtIndex();
						// assertThat(questionPrompt.getAnswerText(), is("A"));
						expect(
							scenario.proposed_getSelectedOptionLabelsAsText({
								assertCurrentReference: '/data/select',
							})
						).toEqual(['A']);
					});

					it("gets the available select items' labels (supplemental)", async () => {
						const scenario = await Scenario.init(
							'Select',
							html(
								head(
									title('Select'),
									model(
										mainInstance(t("data id='select'", t('filter'), t('select', 'a'))),

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
									input('/data/filter'),
									select1Dynamic(
										'/data/select',
										"instance('choices')/root/item[starts-with(value,/data/filter)]"
									)
								)
							)
						);

						scenario.next('/data/filter');
						scenario.next('/data/select');

						expect(
							scenario.proposed_getAvailableOptionLabels({
								assertCurrentReference: '/data/select',
							})
						).toEqual(['A', 'AA', 'B', 'BB']);

						/**
						 * @todo possibly split into yet another supplemental test
						 */
						scenario.answer('/data/filter', 'a');
						scenario.next('/data/select');

						expect(
							scenario.proposed_getAvailableOptionLabels({
								assertCurrentReference: '/data/select',
							})
						).toEqual(['A', 'AA']);
					});
				});

				describe('with translations', () => {
					/**
					 * **PORTING NOTES**
					 *
					 * Fails due to regression, introduced in
					 * {@link https://github.com/getodk/web-forms/commit/24277c2f48729c65716fe6b6ea965e8f403872ce | 24277c2}.
					 * Briefly: the change causes selected items
					 * (`SelectNode.currentState.value`) to reactively update
					 * independently of available options
					 * (`SelectNode.currentState.valueOptions`).
					 *
					 * A potential remedy might involve writing simpler values to the
					 * client state `value` property, and decoding it back to the
					 * `SelectItem`s corresponding to those values. This would have
					 * potential overlap with:
					 *
					 * - Addressing current `InconsistentChildrenStateError` failures
					 * - Further generalizing and hardening that concept (engine state ->
					 *   reactively encode and write to simpler client state type ->
					 *   decode to client-facing runtime value on read). It seems likely
					 *   that would help us guard against other unexpected disconnects
					 *   between internal and client-facing reactivity.
					 *
					 * We may also consider changing `SelectNode` value state to only deal
					 * with the select items' **values**, distinct from their
					 * corresponding `SelectItem` representations. This could either
					 * become a client-facing API change, or tie in with the potential
					 * remedy described above (i.e. store selected **values** in engine
					 * _and client_ states, and compute their `SelectItem`s when reading
					 * `SelectNode.currentState.value`).
					 *
					 * Rephrase?
					 *
					 * - Every test is presumably concerned with the correct behavior.
					 *
					 * - Unclear if the more verbose description is valuable, but IMO it
					 *   better completes the BDD-ish format.
					 */
					it.fails(
						'[gets?] returns [~~]correct[~~] [the translated label text] translation',
						async () => {
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
											mainInstance(t("data id='multilingual-select'", t('select', 'b'))),

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

							scenario.next('/data/select');

							// FormEntryPrompt questionPrompt = scenario.getFormEntryPromptAtIndex();
							// assertThat(questionPrompt.getAnswerText(), is("B (en)"));
							expect(
								scenario.proposed_getSelectedOptionLabelsAsText({
									assertCurrentReference: '/data/select',
								})
							).toEqual(['B (en)']);

							scenario.setLanguage('fr');

							// assertThat(questionPrompt.getAnswerText(), is("B (fr)"));
							expect(
								scenario.proposed_getSelectedOptionLabelsAsText({
									assertCurrentReference: '/data/select',
								})
							).toEqual(['B (fr)']);
						}
					);

					it("gets the available select items' labels (supplemental)", async () => {
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
										mainInstance(t("data id='multilingual-select'", t('select', 'b'))),

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

						scenario.next('/data/select');

						expect(
							scenario.proposed_getAvailableOptionLabels({
								assertCurrentReference: '/data/select',
							})
						).toEqual(['A (en)', 'B (en)', 'C (en)']);

						scenario.setLanguage('fr');

						expect(
							scenario.proposed_getAvailableOptionLabels({
								assertCurrentReference: '/data/select',
							})
						).toEqual(['A (fr)', 'B (fr)', 'C (fr)']);
					});
				});
			});

			describe('on selections[?] in repeat instances', () => {
				it('[gets?] returns [the label text] label inner text', async () => {
					const scenario = await Scenario.init(
						'Select',
						html(
							head(
								title('Select'),
								model(
									mainInstance(
										t(
											"data id='select-repeat'",
											t('repeat', t('select', 'a')),
											t('repeat', t('select', 'a'))
										)
									),

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
									select1Dynamic('/data/repeat/select', "instance('choices')/root/item")
								)
							)
						)
					);

					scenario.next('/data/repeat[1]');
					scenario.next('/data/repeat[1]/select');

					// FormEntryPrompt questionPrompt = scenario.getFormEntryPromptAtIndex();
					// assertThat(questionPrompt.getAnswerText(), is("A"));
					expect(
						scenario.proposed_getSelectedOptionLabelsAsText({
							assertCurrentReference: '/data/repeat[1]/select',
						})
					).toEqual(['A']);

					// JR:
					//
					// Prior to https://github.com/getodk/javarosa/issues/642 being addressed, the selected choice for a select in a
					// repeat instance with the same choice list as the prior repeat instance's select would not be bound to its label
					scenario.next('/data/repeat[2]');
					scenario.next('/data/repeat[2]/select');

					// questionPrompt = scenario.getFormEntryPromptAtIndex();
					// assertThat(questionPrompt.getAnswerText(), is("A"));

					expect(
						scenario.proposed_getSelectedOptionLabelsAsText({
							assertCurrentReference: '/data/repeat[2]/select',
						})
					).toEqual(['A']);
				});

				it("gets the available select items' labels (supplemental)", async () => {
					const scenario = await Scenario.init(
						'Select',
						html(
							head(
								title('Select'),
								model(
									mainInstance(
										t(
											"data id='select-repeat'",
											t('repeat', t('select', 'a')),
											t('repeat', t('select', 'a'))
										)
									),

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
									select1Dynamic('/data/repeat/select', "instance('choices')/root/item")
								)
							)
						)
					);

					scenario.next('/data/repeat[1]');
					scenario.next('/data/repeat[1]/select');

					expect(
						scenario.proposed_getAvailableOptionLabels({
							assertCurrentReference: '/data/repeat[1]/select',
						})
					).toEqual(['A', 'AA', 'B', 'BB']);

					scenario.next('/data/repeat[2]');
					scenario.next('/data/repeat[2]/select');

					expect(
						scenario.proposed_getAvailableOptionLabels({
							assertCurrentReference: '/data/repeat[2]/select',
						})
					).toEqual(['A', 'AA', 'B', 'BB']);
				});
			});
		});
	});
});
