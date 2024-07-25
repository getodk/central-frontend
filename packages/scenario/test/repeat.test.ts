import {
	bind,
	body,
	group,
	head,
	html,
	input,
	item,
	label,
	mainInstance,
	model,
	repeat,
	select1,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { booleanAnswer } from '../src/answer/ExpectedBooleanAnswer.ts';
import { intAnswer } from '../src/answer/ExpectedIntAnswer.ts';
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';
import type { JRFormDef } from '../src/jr/form/JRFormDef.ts';

/**
 * This is **not** intended to be a general purpose `range` implementation.
 * Insofar as we're going to reuse that aspect of JavaRosa test logic, it makes
 * sense for now to keep it separate from any general purpose implementation we
 * might want in the future (e.g. potentially including a `step` parameter,
 * maybe producing an `Iterable`, etc.)
 */
const range = (startInclusive: number, endExclusive: number): readonly number[] => {
	const length = endExclusive - startInclusive;

	return Array.from({ length }, (_, i) => {
		return i + startInclusive;
	});
};

describe('Tests ported from JavaRosa - repeats', () => {
	describe('TriggerableDagTest.java', () => {
		describe('//region Adding or deleting repeats', () => {
			describe('adding repeat instance', () => {
				// https://github.com/getodk/javarosa/blob/059321160e6f8dbb3e81d9add61d68dd35b13cc8/src/test/java/org/javarosa/core/model/TriggerableDagTest.java#L785
				it('updates calculation cascade', async () => {
					// prettier-ignore
					const scenario = await Scenario.init("Add repeat instance", html(
						head(
								title("Add repeat instance"),
								model(
										mainInstance(t("data id=\"repeat-calcs\"",
												t("repeat",
														t("inner1"),
														t("inner2"),
														t("inner3")
												))),
										bind("/data/repeat/inner2").calculate("2 * ../inner1"),
										bind("/data/repeat/inner3").calculate("2 * ../inner2"))),

						body(
								repeat("/data/repeat",
										input("/data/repeat/inner1"))
						)));

					scenario.next('/data/repeat[1]');
					scenario.next('/data/repeat[1]/inner1');
					scenario.answer(0);

					expect(scenario.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(0));
					expect(scenario.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(0));

					scenario.next('/data/repeat');
					scenario.createNewRepeat({ assertCurrentReference: '/data/repeat' });
					scenario.next('/data/repeat[2]/inner1');

					scenario.answer(1);

					expect(scenario.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(2));
					expect(scenario.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(4));
				});

				describe('updates inner calculations with multiple dependencies', () => {
					// This test currently fails due to use of absolute XPath expression
					// into repeat instance, which is not contextualized to the position
					// of its pertinent repeat instance.
					//
					// Note: this is now marked as `fails` rather than `todo` because...
					//
					// 1. It's now considered an expected failure; this is legacy behavior
					//    in JavaRosa that we currently consider out of scope.
					// 2. It's possible that future changes may actually make it pass. For
					//    instance, the current dependency resolution logic would probably
					//    come close to satisfying it; decoupling XPath evaluation from the
					//    browser/XML DOM without any further change to that logic could
					//    conceivably make this test pass.
					// 3. We very likely want to know **more generally** when tests
					//    exercising known failures no longer fail.
					it.fails('(absolute path, from JavaRosa)', async () => {
						// prettier-ignore
						const scenario = await Scenario.init("Repeat cascading calc", html(
							head(
									title("Repeat cascading calc"),
									model(
											mainInstance(t("data id=\"repeat-calcs\"",
													t("repeat",
															t("position"),
															t("position_2"),
															t("other"),
															t("concatenated")
													))),
											// position(..) means the full cascade is evaulated as part of triggerTriggerables
											bind("/data/repeat/position").calculate("position(..)"),
											bind("/data/repeat/position_2").calculate("/data/repeat/position * 2"),
											bind("/data/repeat/other").calculate("2 * 2"),
											// concat needs to be evaluated after /data/repeat/other has a value
											bind("/data/repeat/concatenated").calculate("concat(../position_2, '-', ../other)"))),
							body(
									repeat("/data/repeat",
											input("/data/repeat/concatenated"))
							)));

						scenario.next('/data/repeat[1]');
						scenario.next('/data/repeat[1]/concatenated');
						expect(scenario.answerOf('/data/repeat[1]/concatenated')).toEqualAnswer(
							stringAnswer('2-4')
						);

						scenario.next('/data/repeat');
						scenario.createNewRepeat({ assertCurrentReference: '/data/repeat' });

						scenario.next('/data/repeat[2]/concatenated');
						expect(scenario.answerOf('/data/repeat[2]/concatenated')).toEqualAnswer(
							stringAnswer('4-4')
						);
					});

					it('(updated to be consistent with current pyxform output)', async () => {
						// prettier-ignore
						const scenario = await Scenario.init("Repeat cascading calc", html(
							head(
									title("Repeat cascading calc"),
									model(
											mainInstance(t("data id=\"repeat-calcs\"",
													t("repeat",
															t("position"),
															t("position_2"),
															t("other"),
															t("concatenated")
													))),
											// position(..) means the full cascade is evaulated as part of triggerTriggerables
											bind("/data/repeat/position").calculate("position(..)"),
											bind("/data/repeat/position_2").calculate("../position * 2"),
											bind("/data/repeat/other").calculate("2 * 2"),
											// concat needs to be evaluated after /data/repeat/other has a value
											bind("/data/repeat/concatenated").calculate("concat(../position_2, '-', ../other)"))),
							body(
									repeat("/data/repeat",
											input("/data/repeat/concatenated"))
							)));

						scenario.next('/data/repeat[1]');
						scenario.next('/data/repeat[1]/concatenated');
						expect(scenario.answerOf('/data/repeat[1]/concatenated')).toEqualAnswer(
							stringAnswer('2-4')
						);

						scenario.next('/data/repeat');
						scenario.createNewRepeat({ assertCurrentReference: '/data/repeat' });

						scenario.next('/data/repeat[2]/concatenated');
						expect(scenario.answerOf('/data/repeat[2]/concatenated')).toEqualAnswer(
							stringAnswer('4-4')
						);
					});
				});
			});

			describe('adding or removing repeat instance', () => {
				describe('with calculated count outside repeat', () => {
					/**
					 * **PORTING NOTES**
					 *
					 * - The interaction between range logic and positional state can be
					 *   pretty confusing. The latter is already confusing on its own,
					 *   particularly around "repeat prompts", where the reference to a
					 *   repeat range occurs after all of its instances (which likely
					 *   corresponds to the concept of where an "add repeat" button will be
					 *   in a typical form UI). I don't have an alternative suggestion at
					 *   this time, but it's worth noting that the test did become a bit
					 *   clearer by adding positional reference assertions, but only
					 *   marginally so.
					 *
					 * - References to "dag events" have been commented out. Even if they
					 *   weren't concerned with implementation details (which I'm fairly
					 *   certain I recall that they are), they're not referenced in any
					 *   assertions, and it doesn't seem from the rest of the test logic
					 *   like they should affect its behavior.
					 *
					 * JR:
					 *
					 * Illustrates the second case in
					 * TriggerableDAG.getTriggerablesAffectingAllInstances
					 */
					it('updates reference to count inside', async () => {
						const scenario = await Scenario.init(
							'Count outside repeat used inside',
							html(
								head(
									title('Count outside repeat used inside'),
									model(
										mainInstance(
											t(
												'data id="outside-used-inside"',
												t('count'),

												t('repeat jr:template=""', t('question'), t('inner-count'))
											)
										),
										bind('/data/count').type('int').calculate('count(/data/repeat)'),
										bind('/data/repeat/inner-count').type('int').calculate('/data/count')
									)
								),

								body(repeat('/data/repeat', input('/data/repeat/question')))
							)
						); /* .onDagEvent(dagEvents::add) */

						// dagEvents.clear();

						range(1, 6).forEach((n) => {
							scenario.next('/data/repeat');
							scenario.createNewRepeat({
								assertCurrentReference: '/data/repeat',
							});

							expect(scenario.answerOf('/data/count')).toEqualAnswer(intAnswer(n));

							scenario.next('/data/repeat[' + n + ']/question');
						});

						range(1, 6).forEach((n) => {
							expect(scenario.answerOf('/data/repeat[' + n + ']/inner-count')).toEqualAnswer(
								intAnswer(5)
							);
						});

						scenario.removeRepeat('/data/repeat[5]');

						range(1, 5).forEach((n) => {
							expect(scenario.answerOf('/data/repeat[' + n + ']/inner-count')).toEqualAnswer(
								intAnswer(4)
							);
						});
					});
				});

				/**
				 * **PORTING NOTES**
				 *
				 * Note: reference to "repeat count" is not a reference to `jr:count`,
				 * but a reference to XPath `count()` of repeat instances.
				 *
				 * - - -
				 *
				 * JR:
				 *
				 * In this case, the count(/data/repeat) expression is represented by a
				 * single triggerable. The expression gets evaluated once and it's the
				 * expandReference call in Triggerable.apply which ensures the result is
				 * updated for every repeat instance.
				 */
				it('updates repeat count, inside and outside repeat', async () => {
					const scenario = await Scenario.init(
						'Count outside repeat used inside',
						html(
							head(
								title('Count outside repeat used inside'),
								model(
									mainInstance(
										t(
											'data id="outside-used-inside"',
											t('count'),

											t('repeat jr:template=""', t('question'), t('inner-count'))
										)
									),
									bind('/data/count').type('int').calculate('count(/data/repeat)'),
									bind('/data/repeat/inner-count').type('int').calculate('count(/data/repeat)')
								)
							),

							body(repeat('/data/repeat', input('/data/repeat/question')))
						)
					);

					range(1, 6).forEach((n) => {
						scenario.next('/data/repeat');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/repeat',
						});

						expect(scenario.answerOf('/data/repeat[' + n + ']/inner-count')).toEqualAnswer(
							intAnswer(n)
						);

						scenario.next('/data/repeat[' + n + ']/question');
					});

					range(1, 6).forEach((n) => {
						expect(scenario.answerOf('/data/repeat[' + n + ']/inner-count')).toEqualAnswer(
							intAnswer(5)
						);
					});

					scenario.removeRepeat('/data/repeat[5]');

					range(1, 5).forEach((n) => {
						expect(scenario.answerOf('/data/repeat[' + n + ']/inner-count')).toEqualAnswer(
							intAnswer(4)
						);
					});
				});

				/**
				 * **PORTING NOTES**
				 *
				 * This test exercises JavaRosa behavior which deviates from standard
				 * XPath semantics, wherein absolute expressions referencing repeat
				 * instances (and their descendants), from those instances (or from
				 * their descendants) are implicitly contextualized to that repeat
				 * instance. Per
				 * {@link https://github.com/getodk/web-forms/pull/110#discussion_r1612334986 | this PR comment}:
				 *
				 * > In JR, I believe it's interpreted as
				 * > `count(/data/repeat[position(current()/..)])` which is why the
				 * > count is always 1.
				 *
				 * As I understand it, this is not a behavior we intend to align on. But
				 * there's value in keeping the known failure around as a point of
				 * reference for this difference in behavior.
				 *
				 * - - -
				 *
				 * JR:
				 *
				 * In this case, /data/repeat in the count(/data/repeat) expression is
				 * given the context of the current repeat so the count always evaluates
				 * to 1. See contrast with
				 * addingOrRemovingRepeatInstance_updatesRepeatCount_insideAndOutsideRepeat.
				 */
				it('updates repeat count, inside repeat', async () => {
					const scenario = await Scenario.init(
						'Count outside repeat used inside',
						html(
							head(
								title('Count outside repeat used inside'),
								model(
									mainInstance(
										t(
											'data id="outside-used-inside"',
											t('repeat jr:template=""', t('question'), t('inner-count'))
										)
									),
									bind('/data/repeat/inner-count').type('int').calculate('count(/data/repeat)')
								)
							),

							body(repeat('/data/repeat', input('/data/repeat/question')))
						)
					);

					range(1, 6).forEach((n) => {
						scenario.next('/data/repeat');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/repeat',
						});

						expect(scenario.answerOf('/data/repeat[' + n + ']/inner-count')).toEqualAnswer(
							intAnswer(n)
						);

						scenario.next('/data/repeat[' + n + ']/question');
					});

					range(1, 6).forEach((n) => {
						expect(scenario.answerOf('/data/repeat[' + n + ']/inner-count')).toEqualAnswer(
							intAnswer(5)
						);
					});

					scenario.removeRepeat('/data/repeat[4]');

					range(1, 5).forEach((n) => {
						expect(scenario.answerOf('/data/repeat[' + n + ']/inner-count')).toEqualAnswer(
							intAnswer(4)
						);
					});
				});

				it('updates relative repeat count, inside repeat', async () => {
					const scenario = await Scenario.init(
						'Count outside repeat used inside',
						html(
							head(
								title('Count outside repeat used inside'),
								model(
									mainInstance(
										t(
											'data id="outside-used-inside"',
											t('repeat jr:template=""', t('question'), t('inner-count'))
										)
									),
									bind('/data/repeat/inner-count').type('int').calculate('count(../../repeat)')
								)
							),

							body(repeat('/data/repeat', input('/data/repeat/question')))
						)
					);

					range(1, 6).forEach((n) => {
						scenario.next('/data/repeat');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/repeat',
						});

						expect(scenario.answerOf('/data/repeat[' + n + ']/inner-count')).toEqualAnswer(
							intAnswer(n)
						);

						scenario.next('/data/repeat[' + n + ']/question');
					});

					range(1, 6).forEach((n) => {
						expect(scenario.answerOf('/data/repeat[' + n + ']/inner-count')).toEqualAnswer(
							intAnswer(5)
						);
					});

					scenario.removeRepeat('/data/repeat[4]');

					range(1, 5).forEach((n) => {
						expect(scenario.answerOf('/data/repeat[' + n + ']/inner-count')).toEqualAnswer(
							intAnswer(4)
						);
					});
				});

				describe('with reference to repeat in repeat, and outer sum', () => {
					/**
					 * **PORTING NOTES**
					 *
					 * The assertion with multiplication and division makes me nervous. It
					 * clearly works as expected, but it _feels like_ it's tempting the
					 * floating point rounding error fates.
					 */
					it('updates', async () => {
						const scenario = await Scenario.init(
							'Count outside repeat used inside',
							html(
								head(
									title('Count outside repeat used inside'),
									model(
										mainInstance(
											t(
												'data id="outside-used-inside"',
												t('sum'),

												t('repeat jr:template=""', t('question'), t('position1'), t('position2'))
											)
										),
										bind('/data/sum').type('int').calculate('sum(/data/repeat/position1)'),
										bind('/data/repeat/position1').type('int').calculate('position(..)'),
										bind('/data/repeat/position2').type('int').calculate('../position1')
									)
								),

								body(repeat('/data/repeat', input('/data/repeat/position1')))
							)
						);

						range(1, 6).forEach((n) => {
							scenario.next('/data/repeat');
							scenario.createNewRepeat({
								assertCurrentReference: '/data/repeat',
							});

							expect(scenario.answerOf('/data/sum')).toEqualAnswer(intAnswer((n * (n + 1)) / 2));

							scenario.next('/data/repeat[' + n + ']/position1');
						});

						range(1, 6).forEach((n) => {
							expect(scenario.answerOf('/data/repeat[' + n + ']/position1')).toEqualAnswer(
								intAnswer(n)
							);
						});

						scenario.removeRepeat('/data/repeat[5]');

						range(1, 5).forEach((n) => {
							expect(scenario.answerOf('/data/repeat[' + n + ']/position2')).toEqualAnswer(
								intAnswer(n)
							);
						});
					});
				});

				describe('with reference to previous instance', () => {
					/**
					 * **PORTING NOTES**
					 *
					 * Same thoughts on `nullValue()` -> blank/empty string check
					 */
					it('updates that reference', async () => {
						const scenario = await Scenario.init(
							'Some form',
							html(
								head(
									title('Some form'),
									model(
										mainInstance(
											t(
												'data id="some-form"',
												t('group jr:template=""', t('prev-number'), t('number'))
											)
										),
										bind('/data/group/prev-number')
											.type('int')
											.calculate('/data/group[position() = (position(current()/..) - 1)]/number'),
										bind('/data/group/number').type('int').required()
									)
								),
								body(group('/data/group', repeat('/data/group', input('/data/group/number'))))
							)
						);

						scenario.next('/data/group');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/group',
						});
						scenario.next('/data/group[1]/number');
						scenario.answer(11);

						// assertThat(scenario.answerOf("/data/group[1]/prev-number"), is(nullValue()));
						expect(scenario.answerOf('/data/group[1]/prev-number').getValue()).toBe('');
						expect(scenario.answerOf('/data/group[1]/number')).toEqualAnswer(intAnswer(11));

						scenario.next('/data/group');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/group',
						});
						scenario.next('/data/group[2]/number');
						scenario.answer(22);

						expect(scenario.answerOf('/data/group[1]/number')).toEqualAnswer(intAnswer(11));
						expect(scenario.answerOf('/data/group[2]/number')).toEqualAnswer(intAnswer(22));

						// assertThat(scenario.answerOf('/data/group[1]/prev-number'), is(nullValue()));
						expect(scenario.answerOf('/data/group[1]/prev-number').getValue()).toBe('');
						expect(scenario.answerOf('/data/group[2]/prev-number')).toEqualAnswer(intAnswer(11));

						scenario.next('/data/group');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/group',
						});
						scenario.next('/data/group[3]/number');
						scenario.answer(33);

						// assertThat(scenario.answerOf('/data/group[1]/prev-number'), is(nullValue()));
						expect(scenario.answerOf('/data/group[1]/prev-number').getValue()).toBe('');
						expect(scenario.answerOf('/data/group[2]/prev-number')).toEqualAnswer(intAnswer(11));
						expect(scenario.answerOf('/data/group[3]/prev-number')).toEqualAnswer(intAnswer(22));

						scenario.removeRepeat('/data/group[2]');

						// assertThat(scenario.answerOf('/data/group[1]/prev-number'), is(nullValue()));
						expect(scenario.answerOf('/data/group[1]/prev-number').getValue()).toBe('');
						expect(scenario.answerOf('/data/group[2]/number')).toEqualAnswer(intAnswer(33));
						expect(scenario.answerOf('/data/group[2]/prev-number')).toEqualAnswer(intAnswer(11));
					});
				});

				describe('with relevance inside repeat depending on count', () => {
					/**
					 * **PORTING NOTES**
					 *
					 * A first pass on porting this test produced confusing results, which
					 * turned out to reveal a misunderstanding of Vitest's negated
					 * assertion logic. I had forgotten that there's a custom
					 * `toBeNonRelevant` assertion, and had written `.not.toBeRelevant()`.
					 * That should be totally valid (and would be preferable to paired
					 * custom affirmative/negative cases), and we ought to resolve it
					 * sooner rather than later. More detail is added in
					 * {@link https://github.com/getodk/web-forms/commit/0eda13f81d9901f72c08ffa40a2ab7113888bbb7 | the commit introducing this note: 0eda13f}
					 * at the point of confusing failure, in
					 * `expandSimpleExpectExtensionResult.ts`.
					 */
					it('updates relevance for all instances', async () => {
						const scenario = await Scenario.init(
							'Some form',
							html(
								head(
									title('Some form'),
									model(
										mainInstance(
											t(
												'data id="some-form"',
												t('repeat jr:template=""', t('number'), t('group', t('in_group')))
											)
										),
										bind('/data/repeat/number').type('int').required(),
										bind('/data/repeat/group').relevant('count(../../repeat) mod 2 = 1')
									)
								),
								body(
									repeat(
										'/data/repeat',
										input('/data/repeat/number'),
										group('/data/repeat/group', input('/data/repeat/group/in_group'))
									)
								)
							)
						);

						scenario.next('/data/repeat');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/repeat',
						});

						expect(scenario.getInstanceNode('/data/repeat[1]/group/in_group')).toBeRelevant();

						scenario.createNewRepeat('/data/repeat');

						expect(scenario.getInstanceNode('/data/repeat[2]/group/in_group')).toBeNonRelevant();
						expect(scenario.getInstanceNode('/data/repeat[1]/group/in_group')).toBeNonRelevant();

						scenario.removeRepeat('/data/repeat[2]');

						expect(scenario.getInstanceNode('/data/repeat[1]/group/in_group')).toBeRelevant();
					});
				});
			});
		});

		describe('//region Deleting repeats', () => {
			// JR: deleteSecondRepeatGroup_*
			describe('deleting second repeat instance', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * - Any notion of "dag event" assertions is currently commented out, as
				 *   concerned with JavaRosa implementation details. The test seems
				 *   meaningful without those assertions.
				 *
				 * - Test fails with "act" phase's second `next` call. This is due to
				 *   the ported fixture's use of a relative `<input ref>`. Test is
				 *   parameterized to demonstrate the `next` call and its assertion
				 *   passing with the reference updated to be absolute.
				 *
				 * - Final (non-"dag event") assertion deviates from other tests'
				 *   treatment of `nullValue()` as a blank/empty string check. It is
				 *   clearly intended here as an absence-of-node check, and ported to
				 *   express that. There were several potential methods which could
				 *   presumably produce a similar result, but most of them are currently
				 *   unsuitable because they've been ported to run an internal assertion
				 *   that the looked up node **is present** (and perhaps this is a
				 *   deviation from JavaRosa, where we're being more strict and Java is
				 *   nullable-by-default).
				 */
				// JR: ..._evaluatesTriggerables_dependentOnPrecedingRepeatGroupSiblings
				it('evalutes computations dependent on preceding repeat instance siblings', async () => {
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Some form'),
								model(
									mainInstance(t('data id="some-form"', t('house jr:template=""', t('number')))),
									bind('/data/house/number').type('int').calculate('position(..)')
								)
							),
							body(group('/data/house', repeat('/data/house', input('number'))))
						)
					); /* .onDagEvent(dagEvents::add) */

					range(1, 6).forEach((n) => {
						scenario.next('/data/house');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/house',
						});
						scenario.next('/data/house[' + n + ']/number');
					});

					expect(scenario.answerOf('/data/house[1]/number')).toEqualAnswer(intAnswer(1));
					expect(scenario.answerOf('/data/house[2]/number')).toEqualAnswer(intAnswer(2));
					expect(scenario.answerOf('/data/house[3]/number')).toEqualAnswer(intAnswer(3));
					expect(scenario.answerOf('/data/house[4]/number')).toEqualAnswer(intAnswer(4));
					expect(scenario.answerOf('/data/house[5]/number')).toEqualAnswer(intAnswer(5));

					// Start recording DAG events now
					// dagEvents.clear();

					scenario.removeRepeat('/data/house[2]');

					expect(scenario.answerOf('/data/house[1]/number')).toEqualAnswer(intAnswer(1));
					expect(scenario.answerOf('/data/house[2]/number')).toEqualAnswer(intAnswer(2));
					expect(scenario.answerOf('/data/house[3]/number')).toEqualAnswer(intAnswer(3));
					expect(scenario.answerOf('/data/house[4]/number')).toEqualAnswer(intAnswer(4));

					// assertThat(scenario.answerOf("/data/house[5]/number"), is(nullValue()));
					expect(scenario.indexOf('/data/house[5]/number')).toBeNull();

					// assertDagEvents(dagEvents,
					//     "Processing 'Recalculate' for number [1_1] (1.0), number [2_1] (2.0), number [3_1] (3.0), number [4_1] (4.0)",
					//     "Processing 'Deleted: number [2_1]: 1 triggerables were fired.' for "
					// );
				});

				/**
				 * **PORTING NOTES**
				 *
				 * - Like the test above, the `nullValue()` assertion is ported to its
				 *   equivalent node-absence assertion.
				 */
				// JR: ..._evaluatesTriggerables_dependentOnTheParentPosition
				it('evaluates computations dependent on the parent position', async () => {
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Some form'),
								model(
									mainInstance(
										t(
											'data id="some-form"',
											t('house jr:template=""', t('number'), t('name'), t('name_and_number'))
										)
									),
									bind('/data/house/number').type('int').calculate('position(..)'),
									bind('/data/house/name').type('string').required(),
									bind('/data/house/name_and_number')
										.type('string')
										.calculate('concat(../name, ../number)')
								)
							),
							body(group('/data/house', repeat('/data/house', input('/data/house/name'))))
						)
					); /* .onDagEvent(dagEvents::add) */

					range(1, 6).forEach((n) => {
						scenario.next('/data/house');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/house',
						});
						scenario.next('/data/house[' + n + ']/name');

						scenario.answer(String.fromCharCode(64 + n));
					});

					expect(scenario.answerOf('/data/house[1]/name_and_number')).toEqualAnswer(
						stringAnswer('A1')
					);
					expect(scenario.answerOf('/data/house[2]/name_and_number')).toEqualAnswer(
						stringAnswer('B2')
					);
					expect(scenario.answerOf('/data/house[3]/name_and_number')).toEqualAnswer(
						stringAnswer('C3')
					);
					expect(scenario.answerOf('/data/house[4]/name_and_number')).toEqualAnswer(
						stringAnswer('D4')
					);
					expect(scenario.answerOf('/data/house[5]/name_and_number')).toEqualAnswer(
						stringAnswer('E5')
					);

					// Start recording DAG events now
					// dagEvents.clear();

					scenario.removeRepeat('/data/house[2]');

					expect(scenario.answerOf('/data/house[1]/name_and_number')).toEqualAnswer(
						stringAnswer('A1')
					);
					expect(scenario.answerOf('/data/house[2]/name_and_number')).toEqualAnswer(
						stringAnswer('C2')
					);
					expect(scenario.answerOf('/data/house[3]/name_and_number')).toEqualAnswer(
						stringAnswer('D3')
					);
					expect(scenario.answerOf('/data/house[4]/name_and_number')).toEqualAnswer(
						stringAnswer('E4')
					);

					// assertThat(scenario.answerOf('/data/house[5]/name_and_number'), is(nullValue()));
					expect(scenario.indexOf('/data/house[5]/name_and_number')).toBeNull();

					// assertDagEvents(dagEvents,
					//     "Processing 'Recalculate' for number [1_1] (1.0), number [2_1] (2.0), number [3_1] (3.0), number [4_1] (4.0)",
					//     "Processing 'Recalculate' for name_and_number [1_1] (A1), name_and_number [2_1] (C2), name_and_number [3_1] (D3), name_and_number [4_1] (E4)",
					//     "Processing 'Deleted: number [2_1]: 0 triggerables were fired.' for ",
					//     "Processing 'Deleted: name [2_1]: 0 triggerables were fired.' for ",
					//     "Processing 'Deleted: name_and_number [2_1]: 2 triggerables were fired.' for "
					// );
				});

				/**
				 * **PORTING NOTES**
				 *
				 * Same as previous.
				 */
				// JR: ..._doesNotEvaluateTriggerables_notDependentOnTheParentPosition
				it('does not evaluate computations not dependent on the parent position', async () => {
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Some form'),
								model(
									mainInstance(
										t(
											'data id="some-form"',
											t('house jr:template=""', t('number'), t('name'), t('name_and_number'))
										)
									),
									bind('/data/house/number').type('int').calculate('position(..)'),
									bind('/data/house/name').type('string').required(),
									bind('/data/house/name_and_number')
										.type('string')
										.calculate("concat(../name, 'X')")
								)
							),
							body(group('/data/house', repeat('/data/house', input('/data/house/name'))))
						)
					); /* .onDagEvent(dagEvents::add) */

					range(1, 6).forEach((n) => {
						scenario.next('/data/house');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/house',
						});
						scenario.next('/data/house[' + n + ']/name');
						scenario.answer(String.fromCharCode(64 + n));
					});

					expect(scenario.answerOf('/data/house[1]/name_and_number')).toEqualAnswer(
						stringAnswer('AX')
					);
					expect(scenario.answerOf('/data/house[2]/name_and_number')).toEqualAnswer(
						stringAnswer('BX')
					);
					expect(scenario.answerOf('/data/house[3]/name_and_number')).toEqualAnswer(
						stringAnswer('CX')
					);
					expect(scenario.answerOf('/data/house[4]/name_and_number')).toEqualAnswer(
						stringAnswer('DX')
					);
					expect(scenario.answerOf('/data/house[5]/name_and_number')).toEqualAnswer(
						stringAnswer('EX')
					);

					// Start recording DAG events now
					// dagEvents.clear();

					scenario.removeRepeat('/data/house[2]');

					expect(scenario.answerOf('/data/house[1]/name_and_number')).toEqualAnswer(
						stringAnswer('AX')
					);
					expect(scenario.answerOf('/data/house[2]/name_and_number')).toEqualAnswer(
						stringAnswer('CX')
					);
					expect(scenario.answerOf('/data/house[3]/name_and_number')).toEqualAnswer(
						stringAnswer('DX')
					);
					expect(scenario.answerOf('/data/house[4]/name_and_number')).toEqualAnswer(
						stringAnswer('EX')
					);

					// assertThat(scenario.answerOf('/data/house[5]/name_and_number'), is(nullValue()));
					expect(scenario.indexOf('/data/house[5]/name_and_number')).toBeNull();

					// assertDagEvents(dagEvents,
					//     "Processing 'Recalculate' for number [1_1] (1.0), number [2_1] (2.0), number [3_1] (3.0), number [4_1] (4.0)",
					//     "Processing 'Deleted: number [2_1]: 1 triggerables were fired.' for ",
					//     "Processing 'Recalculate' for name_and_number [2_1] (CX)",
					//     "Processing 'Deleted: name [2_1]: 1 triggerables were fired.' for ",
					//     "Processing 'Deleted: name_and_number [2_1]: 1 triggerables were fired.' for "
					// );
				});
			});

			/**
			 * **PORTING NOTES**
			 *
			 * Rephrase "repeat group" -> "repeat instance"?
			 */
			describe('[deleting] delete third repeat group', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * `range(0, ...)` and asserting `n + 1` position felt awkard.
				 * Updated to `range(1, ...)` per PR feedback.
				 */
				it("evaluates triggerables dependent on the repeat group's number", async () => {
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Some form'),
								model(
									mainInstance(
										t('data id="some-form"', t('house jr:template=""', t('number')), t('summary'))
									),
									bind('/data/house/number').type('int').calculate('position(..)'),
									bind('/data/summary').type('int').calculate('sum(/data/house/number)')
								)
							),
							body(group('/data/house', repeat('/data/house', input('number'))))
						)
					);

					range(1, 11).forEach((n) => {
						scenario.next('/data/house');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/house',
						});
						scenario.next('/data/house[' + n + ']/number');
					});

					expect(scenario.answerOf('/data/summary')).toEqualAnswer(intAnswer(55));

					scenario.removeRepeat('/data/house[3]');

					expect(scenario.answerOf('/data/summary')).toEqualAnswer(intAnswer(45));
				});
			});

			describe('repeat instance deletion', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * - Test is more or less the same as the one(s) ported from
				 *   `deleteThirdRepeatGroup_evaluatesTriggerables_dependentOnTheRepeatGroupsNumber`. The substantive difference is asserting "dag events". This is skipped for now, presumed an implementation detail.
				 *
				 * - If we do decide we want to exercise something like this, it will
				 *   also have the same issue with a relative body reference.
				 *
				 * - - -
				 *
				 * JR:
				 *
				 * Verifies that the list of recalculations triggered by the repeat
				 * instance deletion is minimal. In particular, calculations outside the
				 * repeat should only be re-computed once.
				 */
				it.skip('triggers calculations outside the repeat exactly once', async () => {
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Some form'),
								model(
									mainInstance(
										t('data id="some-form"', t('house jr:template=""', t('number')), t('summary'))
									),
									bind('/data/house/number').type('int').calculate('position(..)'),
									bind('/data/summary').type('int').calculate('sum(/data/house/number)')
								)
							),
							body(group('/data/house', repeat('/data/house', input('number'))))
						)
					); /* .onDagEvent(dagEvents::add) */

					range(1, 11).forEach((n) => {
						scenario.next('/data/house');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/house',
						});
						scenario.next('/data/house[' + n + ']/number');
					});

					// Start recording DAG events now
					// dagEvents.clear();

					scenario.removeRepeat('/data/house[3]');

					expect(scenario.answerOf('/data/summary')).toEqualAnswer(intAnswer(45));

					// assertDagEvents(dagEvents,
					//     "Processing 'Recalculate' for number [1_1] (1.0), number [2_1] (2.0), number [3_1] (3.0), number [4_1] (4.0), number [5_1] (5.0), number [6_1] (6.0), number [7_1] (7.0), number [8_1] (8.0), number [9_1] (9.0)",
					//     "Processing 'Recalculate' for summary [1] (45.0)",
					//     "Processing 'Deleted: number [3_1]: 0 triggerables were fired.' for "
					// );
				});

				/**
				 * **PORTING NOTES**
				 *
				 * - Also a "dag events" implementation detail test
				 *
				 * - **Not skipped** because it has a different form fixture shape
				 */
				it('repeatInstanceDeletion_withoutReferencesToRepeat_evaluatesNoTriggersInInstances', async () => {
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Some form'),
								model(
									mainInstance(
										t(
											'data id="some-form"',
											t('repeat jr:template=""', t('number'), t('numberx2'), t('calc'))
										)
									),
									bind('/data/repeat/number').type('int'),
									bind('/data/repeat/numberx2').type('int').calculate('../number * 2'),
									bind('/data/repeat/calc').type('int').calculate('2 * random()')
								)
							),
							body(group('/data/repeat', repeat('/data/repeat', input('number'))))
						)
					); /* .onDagEvent(dagEvents::add) */

					range(1, 11).forEach((n) => {
						scenario.next('/data/repeat');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/repeat',
						});
						scenario.next('/data/repeat[' + n + ']/number');
					});

					// Start recording DAG events now
					// dagEvents.clear();

					scenario.removeRepeat('/data/repeat[3]');

					// assertDagEvents(dagEvents,
					//     "Processing 'Recalculate' for numberx2 [3_1] (NaN)",
					//     "Processing 'Deleted: number [3_1]: 1 triggerables were fired.' for ",
					//     "Processing 'Deleted: numberx2 [3_1]: 0 triggerables were fired.' for ",
					//     "Processing 'Deleted: calc [3_1]: 0 triggerables were fired.' for "
					// );
				});
			});

			/**
			 * **PORTING NOTES**
			 *
			 * This sub-suite description is redundant to an earlier block. It's
			 * separate here to preserve test order, specifically because several
			 * other tests' porting notes reference their respective
			 * immediately-preceding test. Consider reorganizing.
			 */
			describe('[deleting] delete third repeat group', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * - Rephrase "triggerable"?
				 *
				 * - Rephrase "repeat group" -> "repeat instance"?
				 *
				 * - - -
				 *
				 * JR:
				 *
				 * Indirectly means that the calculation - `concat(/data/house/name)` -
				 * does not take the `/data/house` nodeset (the repeat group) as an
				 * argument but since it takes one of its children (`name` children),
				 * the calculation must re-evaluated once after a repeat group deletion
				 * because one of the children has been deleted along with its parent
				 * (the repeat group instance).
				 */
				it("evaluates triggerables indirectly dependent on the repeat group's number", async () => {
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Some form'),
								model(
									mainInstance(
										t('data id="some-form"', t('house jr:template=""', t('name')), t('summary'))
									),
									bind('/data/house/name').type('string').required(),
									bind('/data/summary').type('string').calculate('concat(/data/house/name)')
								)
							),
							body(group('/data/house', repeat('/data/house', input('/data/house/name'))))
						)
					); /* .onDagEvent(dagEvents::add) */

					range(1, 6).forEach((n) => {
						scenario.next('/data/house');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/house',
						});
						scenario.next('/data/house[' + n + ']/name');

						scenario.answer(String.fromCharCode(64 + n));
					});

					expect(scenario.answerOf('/data/summary')).toEqualAnswer(stringAnswer('ABCDE'));

					// Start recording DAG events now
					// dagEvents.clear();

					scenario.removeRepeat('/data/house[3]');

					expect(scenario.answerOf('/data/summary')).toEqualAnswer(stringAnswer('ABDE'));

					// assertDagEvents(dagEvents,
					//     "Processing 'Recalculate' for summary [1] (ABDE)",
					//         "Processing 'Deleted: name [3_1]: 1 triggerables were fired.' for "
					// );
				});
			});

			describe('[deleting] delete last repeat', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * Rephrase?
				 */
				it('evaluates triggerables', async () => {
					const scenario = await Scenario.init(
						'Delete last repeat instance',
						html(
							head(
								title('Delete last repeat instance'),
								model(
									mainInstance(
										t(
											'data id="delete-last-repeat-instance"',
											t('repeat-count'),

											t('repeat', t('question')),
											t('repeat', t('question')),
											t('repeat', t('question'))
										)
									),
									bind('/data/repeat-count').type('int').calculate('count(/data/repeat)')
								)
							),
							body(repeat('/data/repeat', input('question')))
						)
					);

					expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(3));

					scenario.removeRepeat('/data/repeat[3]');

					expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(2));
				});

				it('evaluates triggerables, indirectly dependent on the deleted repeat', async () => {
					const scenario = await Scenario.init(
						'Delete last repeat instance',
						html(
							head(
								title('Delete last repeat instance'),
								model(
									mainInstance(
										t(
											'data id="delete-last-repeat-instance"',
											t('summary'),

											t('repeat', t('question', 'a')),
											t('repeat', t('question', 'b')),
											t('repeat', t('question', 'c'))
										)
									),
									bind('/data/summary').type('string').calculate('concat(/data/repeat/question)')
								)
							),
							body(repeat('/data/repeat', input('question')))
						)
					);

					expect(scenario.answerOf('/data/summary')).toEqualAnswer(stringAnswer('abc'));

					scenario.removeRepeat('/data/repeat[3]');

					expect(scenario.answerOf('/data/summary')).toEqualAnswer(stringAnswer('ab'));
				});
			});
		});

		describe('//region Adding repeats', () => {
			describe('adding repeat instance', () => {
				interface PrimaryInstanceIdOptions {
					readonly temporarilyIncludePrimaryInstanceId: boolean;
				}

				/**
				 * **PORTING NOTES**
				 *
				 * - Rephrase?
				 *
				 * - Fails without primary instance id: engine presently checks for one
				 *   and fails fast without. Parameterized to demonstrate the test
				 *   passes otherwise.
				 *
				 * - Spec language does not suggest this is optional, but there are a
				 *   few other tests without. Unclear if we should support forms without
				 *   a primary instance id (treat as a bug) or update JavaRosa tests. As
				 *   such, parameterization is currently expressed as temporary.
				 *
				 * - - -
				 *
				 * JR:
				 *
				 * Excercises the triggerTriggerables call in createRepeatInstance.
				 */
				describe.each<PrimaryInstanceIdOptions>([
					{ temporarilyIncludePrimaryInstanceId: false },
					{ temporarilyIncludePrimaryInstanceId: true },
				])(
					'temporarily include primary instance id: $temporarilyIncludePrimaryInstanceId',
					({ temporarilyIncludePrimaryInstanceId }) => {
						let testFn: typeof it | typeof it.fails;

						if (temporarilyIncludePrimaryInstanceId) {
							testFn = it;
						} else {
							testFn = it.fails;
						}

						testFn(
							'triggers triggerables outside repeat that reference repeat nodeset',
							async () => {
								const scenario = await Scenario.init(
									'Form',
									html(
										head(
											title('Form'),
											model(
												mainInstance(
													t(
														temporarilyIncludePrimaryInstanceId ? 'data id="temp-id"' : 'data',
														t('count'),
														t('repeat jr:template=""', t('string'))
													)
												),
												bind('/data/count').type('int').calculate('count(/data/repeat)'),
												bind('/data/repeat/string').type('string')
											)
										),
										body(repeat('/data/repeat', input('/data/repeat/string')))
									)
								);

								scenario.createNewRepeat('/data/repeat');
								scenario.createNewRepeat('/data/repeat');

								expect(scenario.answerOf('/data/count')).toEqualAnswer(intAnswer(2));
							}
						);

						interface PredicateOptions {
							readonly oneBasedPositionPredicates: boolean;
						}

						/**
						 * **PORTING NOTES**
						 *
						 * - Same notes (on primary instance id) as previous test.
						 *
						 * - ~~Unclear how this passes in JavaRosa! It's still using 0-based
						 *   indexes rather than 1-based XPath position predicates.~~
						 *   {@link https://github.com/getodk/web-forms/pull/110/files#r1612356033}
						 *
						 * - To demonstrate both of these issues, test is further
						 *   parameterized to optionally update the assertions ported from
						 *   JavaRosa to 1-based position predicates
						 *
						 *     Both parameters (1-based position predicates plus the outer
						 *     temporary inclusion of a primary instance id) currently must
						 *     be true for the test to pass.
						 *
						 * - - -
						 *
						 * JR:
						 *
						 * Excercises the initializeTriggerables call in
						 * createRepeatInstance.
						 */
						describe.each<PredicateOptions>([
							{ oneBasedPositionPredicates: false },
							{ oneBasedPositionPredicates: true },
						])(
							'one-based position predicates: $oneBasedPositionPredicates',
							({ oneBasedPositionPredicates }) => {
								if (temporarilyIncludePrimaryInstanceId && oneBasedPositionPredicates) {
									testFn = it;
								} else {
									testFn = it.fails;
								}

								testFn('triggers descendant node triggerables', async () => {
									const scenario = await Scenario.init(
										'Form',
										html(
											head(
												title('Form'),
												model(
													mainInstance(
														t(
															temporarilyIncludePrimaryInstanceId ? 'data id="temp-id"' : 'data',
															t('repeat jr:template=""', t('string'), t('group', t('int')))
														)
													),
													bind('/data/repeat/string').type('string'),
													bind('/data/repeat/group').relevant('0')
												)
											),
											body(
												repeat(
													'/data/repeat',
													input('/data/repeat/string'),
													input('/data/repeat/group/int')
												)
											)
										)
									);

									scenario.next('/data/repeat');
									scenario.createNewRepeat({
										assertCurrentReference: '/data/repeat',
									});

									scenario.next('/data/repeat[1]/string');
									scenario.next('/data/repeat');

									if (oneBasedPositionPredicates) {
										expect(scenario.getInstanceNode('/data/repeat[1]/group/int')).toBeNonRelevant();
									} else {
										expect(scenario.getInstanceNode('/data/repeat[0]/group/int')).toBeNonRelevant();
									}

									scenario.createNewRepeat({
										assertCurrentReference: '/data/repeat',
									});

									scenario.next('/data/repeat[2]/string');
									scenario.next('/data/repeat');

									if (oneBasedPositionPredicates) {
										expect(scenario.getInstanceNode('/data/repeat[2]/group/int')).toBeNonRelevant();
									} else {
										expect(scenario.getInstanceNode('/data/repeat[1]/group/int')).toBeNonRelevant();
									}

									scenario.createNewRepeat({
										assertCurrentReference: '/data/repeat',
									});

									scenario.next('/data/repeat[3]/string');
									scenario.next('/data/repeat');

									if (oneBasedPositionPredicates) {
										expect(scenario.getInstanceNode('/data/repeat[3]/group/int')).toBeNonRelevant();
									} else {
										expect(scenario.getInstanceNode('/data/repeat[2]/group/int')).toBeNonRelevant();
									}
								});
							}
						);
					}
				);
			});
		});

		/**
		 * **PORTING NOTES**
		 *
		 * All tests in this region are ignored in JavaRosa, with the note:
		 *
		 * > "Fails on v2.17.0 (before DAG simplification)"
		 *
		 * As I understand it:
		 *
		 * - Each of these tests deal with (re)computations which would be expected,
		 *   per spec, in leading repeat instances (as in, those which precede the
		 *   user's current positional state while filling a form instance).
		 *
		 * - These specific computations under test are deferred, again as I
		 *   understand it, until submission.
		 *
		 * - Deferring such computations is a performance consideration, where
		 *   certain aspects of state are treated as eventually spec-consistent to
		 *   reduce the burden of those computations on filling later parts of a
		 *   form (and as such, any inconsistent state would not typically be
		 *   visible to a user).
		 *
		 * With those understandings, my intent in porting this region is to leave
		 * all of the tests un-ignored for now (even if they also fail for reasons
		 * specific to the _web forms engine_'s current correctness/completion
		 * status), on the basis that we do not currently have any notion of
		 * deferring any computations, and we should use these tests to better
		 * understand how closely we align with expected spec behavior.
		 */
		describe("//region DAG limitations (cases that aren't correctly updated)", () => {
			describe('adding repeat instance, with inner sum of question in repeat', () => {
				/**
				 *
				 * JR:
				 *
				 * This case is where a particular field in a repeat makes an aggregate
				 * computation over another field in the repeat. This should cause every
				 * repeat instance to be updated. We could handle this by using a
				 * strategy similar to getTriggerablesAffectingAllInstances but for
				 * initializeTriggerables.
				 */
				it('updates inner sum for all instances', async () => {
					const scenario = await Scenario.init(
						'Count outside repeat used inside',
						html(
							head(
								title('Count outside repeat used inside'),
								model(
									mainInstance(
										t(
											'data id="outside-used-inside"',
											t('repeat jr:template=""', t('question', '5'), t('inner-sum'))
										)
									),
									bind('/data/repeat/inner-sum').type('int').calculate('sum(../../repeat/question)')
								)
							),

							body(repeat('/data/repeat', input('/data/repeat/question')))
						)
					);

					range(1, 6).forEach((n) => {
						scenario.next('/data/repeat');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/repeat',
						});

						expect(scenario.answerOf('/data/repeat[' + n + ']/inner-sum')).toEqualAnswer(
							intAnswer(n * 5)
						);

						scenario.next('/data/repeat[' + n + ']/question');
					});

					range(1, 6).forEach((n) => {
						expect(scenario.answerOf('/data/repeat[' + n + ']/inner-sum')).toEqualAnswer(
							intAnswer(25)
						);
					});

					scenario.removeRepeat('/data/repeat[4]');

					range(1, 5).forEach((n) => {
						expect(scenario.answerOf('/data/repeat[' + n + ']/inner-sum')).toEqualAnswer(
							intAnswer(20)
						);
					});
				});
			});

			describe('changing value in repeat, with reference to next instance', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * - Typical `nullValue()` -> blank/empty string check
				 *
				 * - - -
				 *
				 * JR:
				 *
				 *
				 * In this test, it's not the repeat addition that needs to trigger
				 * recomputation across repeat instances, it's the setting of the number
				 * value in a specific instance. There's currently no mechanism to do
				 * that. When a repeat is added, it will trigger recomputation for
				 * previous instances.
				 */
				it('updates previous instance', async () => {
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Some form'),
								model(
									mainInstance(
										t(
											'data id="some-form"',
											t('group jr:template=""', t('number'), t('next-number'))
										)
									),
									bind('/data/group/number').type('int').required(),
									bind('/data/group/next-number')
										.type('int')
										.calculate('/data/group[position() = (position(current()/..) + 1)]/number')
								)
							),
							body(group('/data/group', repeat('/data/group', input('/data/group/number'))))
						)
					);

					scenario.next('/data/group');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/group',
					});
					scenario.next('/data/group[1]/number');
					scenario.answer(11);

					// assertThat(scenario.answerOf("/data/group[1]/next-number"), is(nullValue()));
					expect(scenario.answerOf('/data/group[1]/next-number').getValue()).toBe('');
					expect(scenario.answerOf('/data/group[1]/number')).toEqualAnswer(intAnswer(11));

					scenario.next('/data/group');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/group',
					});
					scenario.next('/data/group[2]/number');
					scenario.answer(22);

					expect(scenario.answerOf('/data/group[1]/number')).toEqualAnswer(intAnswer(11));
					expect(scenario.answerOf('/data/group[2]/number')).toEqualAnswer(intAnswer(22));

					// JR: This assertion is false because setting the answer to 22 didn't trigger recomputation across repeat instances
					expect(scenario.answerOf('/data/group[1]/next-number')).toEqualAnswer(intAnswer(22));
					// assertThat(scenario.answerOf("/data/group[2]/next-number"), is(nullValue()));
					expect(scenario.answerOf('/data/group[2]/next-number').getValue()).toBe('');

					scenario.next('/data/group');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/group',
					});
					scenario.next('/data/group[3]/number');
					scenario.answer(33);

					// JR: This assertion is true because adding a new repeat triggered recomputation across repeat instances
					expect(scenario.answerOf('/data/group[1]/next-number')).toEqualAnswer(intAnswer(22));
					// This assertion is false because setting the answer to 33 didn't trigger recomputation across repeat instances
					expect(scenario.answerOf('/data/group[2]/next-number')).toEqualAnswer(intAnswer(33));
					// assertThat(scenario.answerOf("/data/group[3]/next-number"), is(nullValue()));
					expect(scenario.answerOf('/data/group[3]/next-number').getValue()).toBe('');
				});
			});

			describe('(issue 119) target question', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * - First assertion of boolean answer fails due to current (default)
				 *   serialization behavior in engine (expression produces a boolean,
				 *   which is serialized to the string representation of that boolean;
				 *   my understanding is that it will be expected to serialze as `true`
				 *   -> "1", `false` -> "0").
				 *
				 * - A quick check on whether other assertions pass without addressing
				 *   the boolean serialization reveals another failure, on at least one
				 *   relevance check. No further analysis has been performed thus far.
				 */
				it.fails('should be relevant', async () => {
					// JR:
					//
					// This is a translation of the XML form in the issue to our DSL with
					// some adaptations:
					// - Explicit binds for all fields
					// - Migrated the condition field to boolean, which should be easier
					//   to understand
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Some form'),
								model(
									mainInstance(
										t(
											'data id="some-form"',
											t('outer_trigger', 'D'),
											t('inner_trigger'),
											t('outer', t('inner', t('target_question')), t('inner_condition')),
											t('end')
										)
									),
									bind('/data/outer_trigger').type('string'),
									bind('/data/inner_trigger').type('int'),
									bind('/data/outer').relevant("/data/outer_trigger = 'D'"),
									bind('/data/outer/inner_condition')
										.type('boolean')
										.calculate('/data/inner_trigger > 10'),
									bind('/data/outer/inner').relevant('../inner_condition'),
									bind('/data/outer/inner/target_question').type('string')
								)
							),
							body(
								input('inner_trigger', label('inner trigger (enter 5)')),
								input('outer_trigger', label("outer trigger (enter 'D')")),
								input(
									'outer/inner/target_question',
									label('target question: i am incorrectly skipped')
								),
								input('end', label('this is the end of the form'))
							)
						)
					);

					// Starting conditions (outer trigger is D, inner trigger is empty)
					expect(scenario.getInstanceNode('/data/outer')).toBeRelevant();
					expect(scenario.getInstanceNode('/data/outer/inner_condition')).toBeRelevant();
					expect(scenario.answerOf('/data/outer/inner_condition')).toEqualAnswer(
						booleanAnswer(false)
					);
					expect(scenario.getInstanceNode('/data/outer/inner')).toBeNonRelevant();
					expect(scenario.getInstanceNode('/data/outer/inner/target_question')).toBeNonRelevant();

					scenario.answer('/data/inner_trigger', 15);

					expect(scenario.getInstanceNode('/data/outer')).toBeRelevant();
					expect(scenario.getInstanceNode('/data/outer/inner_condition')).toBeRelevant();
					expect(scenario.answerOf('/data/outer/inner_condition')).toEqualAnswer(
						booleanAnswer(true)
					);
					expect(scenario.getInstanceNode('/data/outer/inner')).toBeRelevant();
					expect(scenario.getInstanceNode('/data/outer/inner/target_question')).toBeRelevant();

					scenario.answer('/data/outer_trigger', 'A');

					expect(scenario.getInstanceNode('/data/outer')).toBeNonRelevant();
					expect(scenario.getInstanceNode('/data/outer/inner_condition')).toBeNonRelevant();
					expect(scenario.answerOf('/data/outer/inner_condition')).toEqualAnswer(
						booleanAnswer(true)
					);
					expect(scenario.getInstanceNode('/data/outer/inner')).toBeNonRelevant();
					expect(scenario.getInstanceNode('/data/outer/inner/target_question')).toBeRelevant();
				});
			});
		});

		describe('//region Repeat misc', () => {
			describe('(issue 135) verify that counts in inner repeats work as expected', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * - Fails on second `next` call's node-set reference assertion
				 *   (resolving to the outer repeat's "prompt" event, i.e. the repeat
				 *   range itself). This is currently to be expected, as we don't yet
				 *   support `jr:count`.
				 *
				 * @todo The asserted node-set references are best guess (cross
				 * referencing `getPositionalEvents` and `collectFlatNodeList`) in hopes
				 * it will match the intent of the original test once we do support
				 * `jr:count`. We can verify when we work on that feature.
				 */
				it.fails('[updates the count]', async () => {
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Some form'),
								model(
									mainInstance(
										t(
											'data id="some-form"',
											t('outer-count', '0'),
											t(
												'outer jr:template=""',
												t('inner-count', '0'),
												t('inner jr:template=""', t('some-field'))
											)
										)
									),
									bind('/data/outer-count').type('int'),
									bind('/data/outer/inner-count').type('int'),
									bind('/data/outer/inner/some-field').type('string')
								)
							),
							body(
								input('/data/outer-count'),
								group(
									'/data/outer',
									repeat(
										'/data/outer',
										'/data/outer-count',
										input('/data/outer/inner-count'),
										group(
											'/data/outer/inner',
											repeat(
												'/data/outer/inner',
												'../inner-count',
												input('/data/outer/inner/some-field')
											)
										)
									)
								)
							)
						)
					);

					scenario.next('/data/outer-count');
					scenario.answer(2);
					scenario.next('/data/outer[1]');
					scenario.next('/data/outer[1]/inner-count');
					scenario.answer(3);
					scenario.next('/data/outer[1]/inner[1]');
					scenario.next('/data/outer[1]/inner[1]/some-field');
					scenario.answer('Some field 0-0');
					scenario.next('/data/outer[1]/inner[2]');
					scenario.next('/data/outer[1]/inner[2]/some-field');
					scenario.answer('Some field 0-1');
					scenario.next('/data/outer[1]/inner[3]');
					scenario.next('/data/outer[1]/inner[3]/some-field');
					scenario.answer('Some field 0-2');
					scenario.next('/data/outer[2]');
					scenario.next('/data/outer[2]/inner-count');
					scenario.answer(2);
					scenario.next('/data/outer[2]/inner[1]');
					scenario.next('/data/outer[2]/inner[1]/some-field');
					scenario.answer('Some field 1-0');
					scenario.next('/data/outer[2]/inner[1]');
					scenario.next('/data/outer[2]/inner[1]/some-field');
					scenario.answer('Some field 1-1');
					scenario.next('END_OF_FORM');

					expect(scenario.countRepeatInstancesOf('/data/outer[1]/inner')).toBe(3);
					expect(scenario.countRepeatInstancesOf('/data/outer[2]/inner')).toBe(2);
				});
			});

			describe('adding nested repeat instance', () => {
				it('updates expression triggered by generic ref, for all repeat instances', async () => {
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Some form'),
								model(
									mainInstance(
										t(
											'data id="some-form"',
											t(
												'outer jr:template=""',
												t('inner jr:template=""', t('count'), t('some-field')),
												t('some-field')
											)
										)
									),
									bind('/data/outer/inner/count').type('int').calculate('count(../../inner)')
								)
							),
							body(
								group(
									'/data/outer',
									repeat(
										'/data/outer',
										input('/data/outer/some-field'),
										group(
											'/data/outer/inner',
											repeat('/data/outer/inner', input('/data/outer/inner/some-field'))
										)
									)
								)
							)
						)
					);

					scenario.createNewRepeat('/data/outer');
					scenario.createNewRepeat('/data/outer[1]/inner');
					scenario.createNewRepeat('/data/outer[1]/inner');
					scenario.createNewRepeat('/data/outer[1]/inner');
					scenario.createNewRepeat('/data/outer');
					scenario.createNewRepeat('/data/outer[2]/inner');
					scenario.createNewRepeat('/data/outer[2]/inner');

					expect(scenario.answerOf('/data/outer[1]/inner[1]/count')).toEqualAnswer(intAnswer(3));
					expect(scenario.answerOf('/data/outer[1]/inner[2]/count')).toEqualAnswer(intAnswer(3));
					expect(scenario.answerOf('/data/outer[1]/inner[3]/count')).toEqualAnswer(intAnswer(3));
					expect(scenario.answerOf('/data/outer[2]/inner[1]/count')).toEqualAnswer(intAnswer(2));
					expect(scenario.answerOf('/data/outer[2]/inner[2]/count')).toEqualAnswer(intAnswer(2));
				});
			});

			describe('adding repeat instance', () => {
				it('updates reference to last instance, using position predicate', async () => {
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Some form'),
								model(
									mainInstance(
										t(
											'data id="some-form"',
											t('group jr:template=""', t('number')),
											t('count'),
											t('result_1'),
											t('result_2')
										)
									),
									bind('/data/group/number').type('int').required(),
									bind('/data/count').type('int').calculate('count(/data/group)'),
									bind('/data/result_1')
										.type('int')
										.calculate('10 + /data/group[position() = /data/count]/number'),
									bind('/data/result_2')
										.type('int')
										.calculate('10 + /data/group[position() = count(../group)]/number')
								)
							),
							body(group('/data/group', repeat('/data/group', input('/data/group/number'))))
						)
					);

					scenario.next('/data/group');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/group',
					});
					scenario.next('/data/group[1]/number');
					scenario.answer(10);

					expect(scenario.answerOf('/data/count')).toEqualAnswer(intAnswer(1));
					expect(scenario.answerOf('/data/result_1')).toEqualAnswer(intAnswer(20));
					expect(scenario.answerOf('/data/result_2')).toEqualAnswer(intAnswer(20));

					scenario.next('/data/group');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/group',
					});
					scenario.next('/data/group[2]/number');
					scenario.answer(20);

					expect(scenario.answerOf('/data/count')).toEqualAnswer(intAnswer(2));
					expect(scenario.answerOf('/data/result_1')).toEqualAnswer(intAnswer(30));

					// This would fail with count(/data/group) because the absolute ref would get a multiplicity
					expect(scenario.answerOf('/data/result_2')).toEqualAnswer(intAnswer(30));
				});
			});
		});
	});

	/**
	 * **PORTING NOTES**
	 *
	 * Each `FormEntryController.EVENT_END_OF_FORM` assertion has been replaced
	 * with a plain enum value check. The original assertion semantics would
	 * require a bit of weird casting logic, for what doesn't seem like much gain
	 * in our usage. Revisit if closer source compatibility is preferred.
	 */
	describe('RepeatTest.java', () => {
		describe('when repeat is not relevant', () => {
			// ..._repeatPromptIsSkipped
			it('skips the repeat prompt', async () => {
				const scenario = await Scenario.init(
					'Non relevant repeat',
					html(
						head(
							title('Non relevant repeat'),
							model(
								mainInstance(t('data id="non_relevant_repeat"', t('repeat1', t('q1')))),
								bind('/data/repeat1').relevant('false()')
							)
						),
						body(repeat('/data/repeat1', input('/data/repeat1/q1')))
					)
				);

				scenario.jumpToBeginningOfForm();

				const event = scenario.next('END_OF_FORM');

				// assertThat(event, is(FormEntryController.EVENT_END_OF_FORM));
				expect(event.eventType).toBe('END_OF_FORM');
			});
		});

		describe('when repeat relevance is dynamic and not relevant', () => {
			// ..._repeatPromptIsSkipped
			it('skips the repeat prompt', async () => {
				const scenario = await Scenario.init(
					'Repeat relevance - dynamic expression',
					html(
						head(
							title('Repeat relevance - dynamic expression'),
							model(
								mainInstance(
									t('data id="repeat_relevance_dynamic"', t('selectYesNo'), t('repeat1', t('q1')))
								),
								bind('/data/repeat1').relevant("/data/selectYesNo = 'yes'")
							)
						),
						body(
							select1('/data/selectYesNo', item('yes', 'Yes'), item('no', 'No')),
							repeat('/data/repeat1', input('/data/repeat1/q1'))
						)
					)
				);

				scenario.jumpToBeginningOfForm();
				scenario.answer('/data/selectYesNo', 'no');

				const event = scenario.next('END_OF_FORM');

				// assertThat(event, is(FormEntryController.EVENT_END_OF_FORM));
				expect(event.eventType).toBe('END_OF_FORM');
			});
		});

		describe('when repeat and top level node have [the] same relevance expression and [that] expression evaluates to false', () => {
			// ..._repeatPromptIsSkipped
			it('skips the repeat prompt', async () => {
				const scenario = await Scenario.init(
					'Repeat relevance same as other',
					html(
						head(
							title('Repeat relevance same as other'),
							model(
								mainInstance(
									t(
										'data id="repeat_relevance_same_as_other"',
										t('selectYesNo', 'no'),
										t('repeat1', t('q1')),
										t('q0')
									)
								),
								bind('/data/q0').relevant("/data/selectYesNo = 'yes'"),
								bind('/data/repeat1').relevant("/data/selectYesNo = 'yes'")
							)
						),
						body(
							select1('/data/selectYesNo', item('yes', 'Yes'), item('no', 'No')),
							repeat('/data/repeat1', input('/data/repeat1/q1'))
						)
					)
				);

				scenario.jumpToBeginningOfForm();
				scenario.next('/data/selectYesNo');

				const event = scenario.next('END_OF_FORM');

				// assertThat(event, is(FormEntryController.EVENT_END_OF_FORM));
				expect(event.eventType).toBe('END_OF_FORM');
			});
		});

		/**
		 * **PORTING NOTES**
		 *
		 * This test was added recently to support this porting effort. It is
		 * currently considered out of scope. Further discussion below, taken from
		 * JavaRosa notes discussing this.
		 *
		 * JR:
		 *
		 * The original ODK XForms spec deviated from XPath rules by stating that
		 * path expressions representing single nodes should be evaluated as
		 * relative to the current nodeset. That has since been removed and all
		 * known form builders create relative references in expressions within a
		 * repeat. We currently maintain this behavior for legacy purposes.
		 */
		describe.skip('absoluteSingleNodePaths_areQualified_forLegacyPurposes');
	});

	describe('FormDefTest.java', () => {
		describe('`canCreateRepeat`', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Fails on call to {@link JRFormDef.deleteRepeat}, as we don't
			 *   anticipate support for an equivalent interface. An alternate approach
			 *   to this test follows (which will also fail initially, as we neither
			 *   support `jr:count` nor provide an API for determining whether
			 *   creating an instance of a particular repeat range, as invoked by a
			 *   client, is permitted).
			 *
			 * - Not specific to this test, in fact probably applicable to a majority
			 *   of tests: we should really consider doing a pass to better align form
			 *   fixtures' titles/primary instance ids with some aspect of the test
			 *   itself. In most cases, the fixtures' title/id are just not very
			 *   useful (I see 120 hits for "Some form" as I write this). In a few,
			 *   like this one, the title/id is clearly a product of copypasta from a
			 *   test of very different functionality. The latter is worth correcting
			 *   in its own right; the former would be worth correcting if/as we
			 *   consider how we might automate making the `scenario` package's test
			 *   fixtures available in a UI client (or other interactive, inspectable,
			 *   and/or debuggable scenarios).
			 */
			it.fails(
				'returns false when repeat count [is defined] set, but the group it belongs to does not exist',
				async () => {
					const scenario = await Scenario.init(
						'Nested repeat relevance',
						html(
							head(
								title('Nested repeat relevance'),
								model(
									mainInstance(
										t(
											'data id="nested-repeat-relevance"',
											t('outer', t('inner_count'), t('inner', t('question')))
										)
									),
									bind('/data/outer/inner_count').type('string').calculate('5')
								)
							),
							body(
								repeat(
									'/data/outer',
									repeat(
										'/data/outer/inner',
										'/data/outer/inner_count',
										input('/data/outer/inner/question')
									)
								)
							)
						)
					);

					scenario.next('/data/outer[1]');

					const outerGroupIndex = scenario.getCurrentIndex();

					scenario.next('/data/outer[1]/inner[1]');

					const innerGroupRef = scenario.refAtIndex();
					const index = scenario.getCurrentIndex();

					const formDef = scenario.getFormDef();

					formDef.deleteRepeat(outerGroupIndex);

					expect(formDef.canCreateRepeat(innerGroupRef, index)).toBe(false);
				}
			);

			it('does not permit creating a repeat instance of a repeat range which does not exist (alternate)', async () => {
				const scenario = await Scenario.init(
					'Nested repeat relevance',
					html(
						head(
							title('Nested repeat relevance'),
							model(
								mainInstance(
									t(
										'data id="nested-repeat-relevance"',
										t('outer', t('inner_count'), t('inner', t('question')))
									)
								),
								bind('/data/outer/inner_count').type('string').calculate('5')
							)
						),
						body(
							repeat(
								'/data/outer',
								repeat(
									'/data/outer/inner',
									'/data/outer/inner_count',
									input('/data/outer/inner/question')
								)
							)
						)
					)
				);

				scenario.next('/data/outer[1]');
				scenario.removeRepeat('/data/outer[1]');

				expect(scenario.proposed_canCreateNewRepeat('/data/outer[1]/inner')).toBe(false);
			});
		});
	});

	describe('IndexedRepeatRelativeRefsTest.java', () => {
		const ABSOLUTE_TARGET = '/data/some-group/item/value';
		const RELATIVE_TARGET = '../item/value';
		const ABSOLUTE_GROUP = '/data/some-group/item';
		const RELATIVE_GROUP = '../item';
		const ABSOLUTE_INDEX = '/data/total-items';
		const RELATIVE_INDEX = '../../total-items';

		interface IndexedRepeatRelativeRefsOptions {
			readonly testName: string;
			readonly target: string;
			readonly group: string;
			readonly index: string;
		}

		const parameters: readonly IndexedRepeatRelativeRefsOptions[] = [
			{
				testName: 'Target: absolute, group: absolute, index: absolute',
				target: ABSOLUTE_TARGET,
				group: ABSOLUTE_GROUP,
				index: ABSOLUTE_INDEX,
			},
			{
				testName: 'Target: absolute, group: absolute, index: relative',
				target: ABSOLUTE_TARGET,
				group: ABSOLUTE_GROUP,
				index: RELATIVE_INDEX,
			},
			{
				testName: 'Target: absolute, group: relative, index: absolute',
				target: ABSOLUTE_TARGET,
				group: RELATIVE_GROUP,
				index: ABSOLUTE_INDEX,
			},
			{
				testName: 'Target: absolute, group: relative, index: relative',
				target: ABSOLUTE_TARGET,
				group: RELATIVE_GROUP,
				index: RELATIVE_INDEX,
			},
			{
				testName: 'Target: relative, group: absolute, index: absolute',
				target: RELATIVE_TARGET,
				group: ABSOLUTE_GROUP,
				index: ABSOLUTE_INDEX,
			},
			{
				testName: 'Target: relative, group: absolute, index: relative',
				target: RELATIVE_TARGET,
				group: ABSOLUTE_GROUP,
				index: RELATIVE_INDEX,
			},
			{
				testName: 'Target: relative, group: relative, index: absolute',
				target: RELATIVE_TARGET,
				group: RELATIVE_GROUP,
				index: ABSOLUTE_INDEX,
			},
			{
				testName: 'Target: relative, group: relative, index: relative',
				target: RELATIVE_TARGET,
				group: RELATIVE_GROUP,
				index: RELATIVE_INDEX,
			},
		];

		/**
		 * **PORTING NOTES**
		 *
		 * - Fails pending implementation of `indexed-repeat` XPath function.
		 *
		 * - Parameters adapted to match values in JavaRosa. Note that the
		 *   parameters are passed as {@link options} rather than destructured. Java
		 *   lets you reference `group` (the class property) and `group` (the
		 *   imported static method) in the same scope. TypeScript/JavaScript don't
		 *   let you do that... which is fine, because doing that is really weird!
		 */
		it.fails.each<IndexedRepeatRelativeRefsOptions>(parameters)('$testName', async (options) => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(
								t(
									'data id="some-form"',
									t('some-group', t('item jr:template=""', t('value')), t('last-value')),
									t('total-items')
								)
							),
							bind(ABSOLUTE_TARGET).type('int'),
							bind('/data/total-items').type('int').calculate('count(/data/some-group/item)'),
							bind('/data/some-group/last-value')
								.type('int')
								.calculate(
									'indexed-repeat(' +
										options.target +
										', ' +
										options.group +
										', ' +
										options.index +
										')'
								)
						)
					),
					body(
						group(
							'/data/some-group',
							group(
								'/data/some-group/item',
								repeat('/data/some-group/item', input('/data/some-group/item/value'))
							)
						)
					)
				)
			);

			scenario.answer('/data/some-group[1]/item[1]/value', 11);
			scenario.answer('/data/some-group[1]/item[2]/value', 22);
			scenario.answer('/data/some-group[1]/item[3]/value', 33);

			expect(scenario.answerOf('/data/total-items')).toEqualAnswer(intAnswer(3));
			expect(scenario.answerOf('/data/some-group/last-value')).toEqualAnswer(intAnswer(33));
		});
	});

	describe('TriggersForRelativeRefsTest.java (regression tests)', () => {
		describe('indefinite repeat `jr:count` expression', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Rephrase?
			 *
			 *     - The word "single" here seems to be referencing depth, not total
			 *       count of repeat instnaces.
			 *
			 *     - The phrase "until condition met" is confusing: the condition is
			 *       an `if` predicate in the `jr:count` expression. It's not clear
			 *       how this could be better conveyed in a test description, but my
			 *       main concern is that I'd probably find it difficult to discover
			 *       this test if I were looking.
			 *
			 * - Test fails pending `jr:count` feature support.
			 *
			 * - When we do get around to repeat count functionality, it seems highly
			 *   likely our positional event filtering will need to skip
			 *   count-controlled repeat "prompts", given the sequence of `next` calls
			 *   and the apparent references they should correspond to.
			 */
			describe('in single[-depth] repeat', () => {
				it.fails('adds repeats until condition met', async () => {
					const scenario = await Scenario.init(
						'indefinite repeat',
						html(
							head(
								title('Indefinite repeat'),
								model(
									mainInstance(
										t(
											'data id="indefinite-repeat"',
											t('count'),
											t('target_count'),
											t('repeat', t('add_more'))
										)
									),
									bind('/data/count').type('int').calculate('count(/data/repeat)'),
									bind('/data/target_count')
										.type('int')
										.calculate(
											"if(/data/count = 0 or /data/repeat[position()=/data/count]/add_more = 'yes', /data/count + 1, /data/count)"
										),
									bind('/data/repeat/add_more').type('string')
								)
							),
							body(repeat('/data/repeat', '/data/target_count', input('/data/repeat/add_more')))
						)
					);

					scenario.next('/data/repeat[1]');
					scenario.next('/data/repeat[1]/add_more');
					scenario.answer('yes');
					scenario.next('/data/repeat[2]');
					scenario.next('/data/repeat[2]/add_more');
					scenario.answer('yes');
					scenario.next('/data/repeat[3]');
					scenario.next('/data/repeat[3]/add_more');
					scenario.answer('no');
					scenario.next('END_OF_FORM');

					expect(scenario.atTheEndOfForm()).toBe(true);
				});
			});

			/**
			 * **PORTING NOTES**
			 *
			 * All of the same notes from the previous (single-depth) test apply to
			 * these, other than commentary about "single" phrasing.
			 */
			describe('in nested repeat', () => {
				it.fails('adds repeats until condition met', async () => {
					const scenario = await Scenario.init(
						'nested indefinite repeat',
						html(
							head(
								title('Indefinite repeat in nested repeat'),
								model(
									mainInstance(
										t(
											'data id="indefinite-nested-repeat"',
											t(
												'outer_repeat',
												t('inner_count'),
												t('target_count'),
												t('inner_repeat', t('add_more'))
											)
										)
									),
									bind('/data/outer_repeat/inner_count')
										.type('int')
										.calculate('count(/data/outer_repeat/inner_repeat)'),
									bind('/data/outer_repeat/target_count')
										.type('int')
										.calculate(
											'if(/data/outer_repeat/inner_count = 0' +
												"or /data/outer_repeat/inner_repeat[position() = /data/outer_repeat/inner_count]/add_more = 'yes', " +
												'/data/outer_repeat/inner_count + 1, /data/outer_repeat/inner_count)'
										)
								)
							),
							body(
								repeat(
									'/data/outer_repeat',
									repeat(
										'/data/outer_repeat/inner_repeat',
										'target_count',
										input('/data/outer_repeat/inner_repeat/add_more')
									)
								)
							)
						)
					);

					scenario.next('/data/outer_repeat[1]');
					scenario.next('/data/outer_repeat[1]/inner_repeat[1]');
					scenario.next('/data/outer_repeat[1]/inner_repeat[1]/add_more');
					scenario.answer('yes');
					scenario.next('/data/outer_repeat[1]/inner_repeat[2]');
					scenario.next('/data/outer_repeat[1]/inner_repeat[2]/add_more');
					scenario.answer('yes');
					scenario.next('/data/outer_repeat[1]/inner_repeat[3]');
					scenario.next('/data/outer_repeat[1]/inner_repeat[3]/add_more');
					scenario.answer('no');
					scenario.next('/data/outer_repeat');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/outer_repeat',
					});
					scenario.next('/data/outer_repeat[2]/inner_repeat[1]');
					scenario.next('/data/outer_repeat[2]/inner_repeat[1]/add_more');
					scenario.answer('yes');
					scenario.next('/data/outer_repeat[2]/inner_repeat[2]');
					scenario.next('/data/outer_repeat[2]/inner_repeat[2]/add_more');
					scenario.answer('no');
					scenario.next('/data/outer_repeat');
					scenario.next('END_OF_FORM');

					expect(scenario.atTheEndOfForm()).toBe(true);
				});

				describe('with relative paths', () => {
					it.fails('adds repeats until condition met', async () => {
						const scenario = await Scenario.init(
							'nested indefinite repeat',
							html(
								head(
									title('Indefinite repeat in nested repeat'),
									model(
										mainInstance(
											t(
												'data id="indefinite-nested-repeat"',
												t(
													'outer_repeat',
													t('inner_count'),
													t('target_count'),
													t('inner_repeat', t('add_more'))
												)
											)
										),
										bind('/data/outer_repeat/inner_count')
											.type('int')
											.calculate('count(../inner_repeat)'),
										bind('/data/outer_repeat/target_count')
											.type('int')
											.calculate(
												'if(../inner_count = 0' +
													"or ../inner_repeat[position() = ../inner_count]/add_more = 'yes', " +
													'../inner_count + 1, ../inner_count)'
											)
									)
								),
								body(
									repeat(
										'/data/outer_repeat',
										repeat(
											'/data/outer_repeat/inner_repeat',
											'target_count',
											input('/data/outer_repeat/inner_repeat/add_more')
										)
									)
								)
							)
						);

						scenario.next('/data/outer_repeat[1]');
						scenario.next('/data/outer_repeat[1]/inner_repeat[1]');
						scenario.next('/data/outer_repeat[1]/inner_repeat[1]/add_more');
						scenario.answer('yes');
						scenario.next('/data/outer_repeat[1]/inner_repeat[2]');
						scenario.next('/data/outer_repeat[1]/inner_repeat[2]/add_more');
						scenario.answer('yes');
						scenario.next('/data/outer_repeat[1]/inner_repeat[3]');
						scenario.next('/data/outer_repeat[1]/inner_repeat[3]/add_more');
						scenario.answer('no');
						scenario.next('/data/outer_repeat');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/outer_repeat',
						});
						scenario.next('/data/outer_repeat[2]/inner_repeat[1]');
						scenario.next('/data/outer_repeat[2]/inner_repeat[1]/add_more');
						scenario.answer('yes');
						scenario.next('/data/outer_repeat[2]/inner_repeat[2]');
						scenario.next('/data/outer_repeat[2]/inner_repeat[2]/add_more');
						scenario.answer('no');
						scenario.next('/data/outer_repeat');
						scenario.next('END_OF_FORM');

						expect(scenario.atTheEndOfForm()).toBe(true);
					});
				});
			});
		});

		interface RepeatPositionOptions {
			readonly addExplicitRepeatPositionPredicate: boolean;
		}

		describe('predicate with relative path expression', () => {
			describe.each<RepeatPositionOptions>([
				{ addExplicitRepeatPositionPredicate: false },
				{ addExplicitRepeatPositionPredicate: true },
			])(
				'add explicit repeat position predicate: $addExplicitRepeatPositionPredicate',
				({ addExplicitRepeatPositionPredicate }) => {
					/**
					 * **PORTING NOTES**
					 *
					 * - Fails in direct port due to lack of position predicates in each
					 *   reference to `outer_repeat`
					 *
					 * - Fails with parameterized option to make the position explicit, on
					 *   assertion of `0` value: current implementation of XPath `sum`
					 *   produces `NaN` when applied to an empty node-set (which is a bug).
					 */
					it.fails('[is] reevaluated when trigger[dependency?] changes', async () => {
						const scenario = await Scenario.init(
							'Predicate trigger',
							html(
								head(
									title('Predicate trigger'),
									model(
										mainInstance(
											t(
												'data id="predicate-trigger"',
												t(
													'outer_repeat',
													t('cutoff_number'),
													t('inner_repeat', t('number', '1')),
													t('inner_repeat', t('number', '2')),
													t('inner_repeat', t('number', '3')),
													t('inner_repeat', t('number', '4')),
													t('inner_repeat', t('number', '5')),
													t('inner_repeat', t('number', '6')),
													t('sum')
												)
											)
										),
										bind('/data/outer_repeat/cutoff_number').type('int'),
										bind('/data/outer_repeat/inner_repeat/number').type('int'),
										bind('/data/outer_repeat/sum')
											.type('int')
											.calculate('sum(../inner_repeat[number > ../cutoff_number]/number)')
									)
								),
								body(
									repeat(
										'/data/outer_repeat',
										input('/data/outer_repeat/cutoff_number'),
										repeat(
											'/data/outer_repeat/inner_repeat',
											input('/data/outer_repeat/inner_repeat/number')
										)
									)
								)
							)
						);

						if (addExplicitRepeatPositionPredicate) {
							scenario.answer('/data/outer_repeat[1]/cutoff_number', 3);
						} else {
							scenario.answer('/data/outer_repeat/cutoff_number', 3);
						}

						if (addExplicitRepeatPositionPredicate) {
							expect(scenario.answerOf('/data/outer_repeat[1]/sum')).toEqualAnswer(intAnswer(15));
						} else {
							expect(scenario.answerOf('/data/outer_repeat/sum')).toEqualAnswer(intAnswer(15));
						}

						if (addExplicitRepeatPositionPredicate) {
							scenario.answer('/data/outer_repeat[1]/cutoff_number', 7);
						} else {
							scenario.answer('/data/outer_repeat/cutoff_number', 7);
						}

						if (addExplicitRepeatPositionPredicate) {
							expect(scenario.answerOf('/data/outer_repeat[1]/sum')).toEqualAnswer(intAnswer(0));
						} else {
							expect(scenario.answerOf('/data/outer_repeat/sum')).toEqualAnswer(intAnswer(0));
						}

						if (addExplicitRepeatPositionPredicate) {
							scenario.answer('/data/outer_repeat[1]/cutoff_number', -11);
						} else {
							scenario.answer('/data/outer_repeat/cutoff_number', -11);
						}

						if (addExplicitRepeatPositionPredicate) {
							expect(scenario.answerOf('/data/outer_repeat[1]/sum')).toEqualAnswer(intAnswer(21));
						} else {
							expect(scenario.answerOf('/data/outer_repeat/sum')).toEqualAnswer(intAnswer(21));
						}
					});
				}
			);
		});

		describe('predicate with `current()` path expression', () => {
			describe.each<RepeatPositionOptions>([
				{ addExplicitRepeatPositionPredicate: false },
				{ addExplicitRepeatPositionPredicate: true },
			])(
				'add explicit repeat position predicate: $addExplicitRepeatPositionPredicate',
				({ addExplicitRepeatPositionPredicate }) => {
					let testFn: typeof it | typeof it.fails;

					if (addExplicitRepeatPositionPredicate) {
						testFn = it;
					} else {
						testFn = it.fails;
					}

					/**
					 * **PORTING NOTES**
					 *
					 * Fails in direct port due to lack of position predicates in each
					 * reference to `outer_repeat` and `inner_repeat`. Parameterized
					 * option to make the positions explicit.
					 */
					testFn('[is] reevaluated when trigger[dependency?] changes', async () => {
						const scenario = await Scenario.init(
							'Predicate trigger',
							html(
								head(
									title('Predicate trigger'),
									model(
										mainInstance(
											t(
												'data id="predicate-trigger"',
												t(
													'outer_repeat',
													t('cutoff_number'),

													t('inner_repeat', t('foo'), t('join'))
												)
											)
										),
										t(
											'instance id="dataset"',
											t(
												'root',
												t('item', t('name', 'Item1'), t('value', '1')),
												t('item', t('name', 'Item2'), t('value', '2')),
												t('item', t('name', 'Item3'), t('value', '3')),
												t('item', t('name', 'Item4'), t('value', '4')),
												t('item', t('name', 'Item5'), t('value', '5'))
											)
										),
										bind('/data/outer_repeat/cutoff_number').type('int'),
										bind('/data/outer_repeat/inner_repeat/join')
											.type('string')
											.calculate(
												"join(', ', instance('dataset')/root/item[value > current()/../../cutoff_number]/name)"
											)
									)
								),
								body(
									repeat(
										'/data/outer_repeat',
										input('/data/outer_repeat/cutoff_number'),
										repeat(
											'/data/outer_repeat/inner_repeat',
											input('/data/outer_repeat/inner_repeat/foo')
										)
									)
								)
							)
						);

						if (addExplicitRepeatPositionPredicate) {
							scenario.answer('/data/outer_repeat[1]/cutoff_number', 3);
						} else {
							scenario.answer('/data/outer_repeat/cutoff_number', 3);
						}

						if (addExplicitRepeatPositionPredicate) {
							expect(scenario.answerOf('/data/outer_repeat[1]/inner_repeat[1]/join')).toEqualAnswer(
								stringAnswer('Item4, Item5')
							);
						} else {
							expect(scenario.answerOf('/data/outer_repeat/inner_repeat/join')).toEqualAnswer(
								stringAnswer('Item4, Item5')
							);
						}

						if (addExplicitRepeatPositionPredicate) {
							scenario.answer('/data/outer_repeat[1]/cutoff_number', 7);
						} else {
							scenario.answer('/data/outer_repeat/cutoff_number', 7);
						}

						if (addExplicitRepeatPositionPredicate) {
							expect(
								scenario.answerOf('/data/outer_repeat[1]/inner_repeat[1]/join').getValue()
							).toBe('');
						} else {
							// assertThat(scenario.answerOf("/data/outer_repeat/inner_repeat/join"), is(nullValue()));
							expect(scenario.answerOf('/data/outer_repeat/inner_repeat/join')).toBe('');
						}

						if (addExplicitRepeatPositionPredicate) {
							scenario.answer('/data/outer_repeat[1]/cutoff_number', 4);
						} else {
							scenario.answer('/data/outer_repeat/cutoff_number', 4);
						}

						if (addExplicitRepeatPositionPredicate) {
							expect(scenario.answerOf('/data/outer_repeat[1]/inner_repeat[1]/join')).toEqualAnswer(
								stringAnswer('Item5')
							);
						} else {
							expect(scenario.answerOf('/data/outer_repeat/inner_repeat/join')).toEqualAnswer(
								stringAnswer('Item5')
							);
						}
					});
				}
			);
		});
	});

	describe('XFormParserTest.java', () => {
		describe('form with `count-non-empty` func[tion]', () => {
			interface NamespaceOptions {
				readonly includeCommonNamespaces: boolean;
			}

			/**
			 * **PORTING NOTES**
			 *
			 * - It's not clear if this belongs here. It's fundamentally a test of the
			 *   XPath `count-non-empty` function, but appears to depend on repeat
			 *   instances as part of exercising the functionality. Otherwise, it
			 *   would probably be best to make the `xpath` package is exercising all
			 *   functionality under test in this form.
			 *
			 * - Fails with directly ported form fixture, which is missing (at least)
			 *   the `xf` namespace declaration. Unclear whether we should:
			 *
			 *     - Produce an initialization error (form is technically invalid)
			 *
			 *     - Detect the condition and handle silently
			 *
			 *     - Detect the condition and handle gracefully, perhaps with a
			 *       warning
			 *
			 *     If we do handle it, we should probably do a sanity check that the
			 *     form doesn't have a namespace collision on the `xf` prefix.
			 *
			 * - Parameterized to use an alternate fixture with common namespaces
			 *   present, to demonstrate the test otherwise passe.
			 */
			describe.each<NamespaceOptions>([
				{ includeCommonNamespaces: false },
				{ includeCommonNamespaces: true },
			])('include common namespaces: $includeCommonNamespaces', ({ includeCommonNamespaces }) => {
				let testFn: typeof it | typeof it.fails;

				if (includeCommonNamespaces) {
					testFn = it;
				} else {
					testFn = it.fails;
				}

				testFn('[calculates the count of non-empty nodes]', async () => {
					const scenario = await Scenario.init(
						includeCommonNamespaces ? 'countNonEmptyForm-alt.xml' : 'countNonEmptyForm.xml'
					);

					expect(scenario.answerOf('/test/count_value')).toEqualAnswer(intAnswer(4));
					expect(scenario.answerOf('/test/count_non_empty_value')).toEqualAnswer(intAnswer(2));
				});
			});
		});
	});
});
