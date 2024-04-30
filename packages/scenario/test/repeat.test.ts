import {
	bind,
	body,
	group,
	head,
	html,
	input,
	item,
	mainInstance,
	model,
	repeat,
	select1,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { intAnswer } from '../src/answer/ExpectedIntAnswer.ts';
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';

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
				 * - Note: reference to "repeat count" is not a reference to `jr:count`,
				 *   but a reference to XPath `count()` of repeat instances.
				 *
				 * - Failure likely caused by reactive subscription logic resolving to a
				 *   single (nullable) node, rather than the set of all nodes for the
				 *   affected node-set.
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
				it.fails('updates repeat count, inside and outside repeat', async () => {
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
				 * - It seems like the comment below from JavaRosa describes a different
				 *   scenario than the test actually exercises? I suspected this may have
				 *   changed in the PR for 1-based indexing, but that doesn't reveal
				 *   anything of interest. Perhaps worth delving deeper into the test's
				 *   git history?
				 *
				 * - The assertions are identical to those above, which is unsurprising
				 *   as the pertinent aspects of the form definition are too.
				 *
				 * - Presumably the same failure mode.
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
				it.fails('updates repeat count, inside repeat', async () => {
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

				/**
				 * **PORTING NOTES**
				 *
				 * - It seems like the comment from JavaRosa on the above test may have
				 *   been intended for this test? It seems to _almost describe_ this
				 *   fixture. (Although to actually produce a consistent `count()` of 1, I
				 *   think the `calculate` would need to be `count(..)`.)
				 *
				 * - Failure is an `InconsistentChildrenStateError`. Without diving into
				 *   the cause, I've only ever seen this when experimenting with UI to
				 *   exercise the engine API capability to add repeat instances at any
				 *   index. It seemed pretty likely at the time that this was a Solid
				 *   compilation bug, as it appeared that Solid's JSX transform triggered
				 *   it. But this suggests that some (as yet undetermined) reactive
				 *   property access may be implicated.
				 *
				 * - A likely quick turnaround remedy would be a somewhat more involved
				 *   children state mapping, with actual `nodeId` lookup rather than the
				 *   current cheat mode implementation.
				 *
				 * - A more "correct" solution would almost certainly involve
				 *   understanding how any particular reactive access could cause these
				 *   states to go out of sync in the first place. It would likely also
				 *   involve some investigation into whether the discrepancy is temporary
				 *   and resolves after yielding to the event loop; this would implicate
				 *   some aspect of Solid's reactive scheduling, which most of our
				 *   reactive internals currently bypass (naively, trading CPU time for
				 *   testability of the reactive bridge implementation).
				 */
				it.fails('updates relative repeat count, inside repeat', async () => {
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
					 * - Another `InconsistentChildrenStateError`, another clue! This case is
					 *   definitely triggered by the
					 *   {@link Scenario.removeRepeat} call.
					 * - Same thoughts on `nullValue()` -> blank/empty string check
					 */
					it.fails('updates that reference', async () => {
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
					 * - This failure is likely to be related to single-node resolution of
					 *   subscription lookups.
					 *
					 * - A first pass on porting this test produced confusing results, which
					 *   turned out to reveal a misunderstanding of Vitest's negated
					 *   assertion logic. I had forgotten that there's a custom
					 *   `toBeNonRelevant` assertion, and had written `.not.toBeRelevant()`.
					 *   That should be totally valid (and would be preferable to paired
					 *   custom affirmative/negative cases), and we ought to resolve it
					 *   sooner rather than later. More detail is added in this commit at
					 *   the point of confusing failure, in
					 *   `expandSimpleExpectExtensionResult.ts`.
					 */
					it.fails('updates relevance for all instances', async () => {
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

						expect(scenario.getAnswerNode('/data/repeat[1]/group/in_group')).toBeRelevant();

						scenario.createNewRepeat('/data/repeat');

						expect(scenario.getAnswerNode('/data/repeat[2]/group/in_group')).toBeNonRelevant();
						expect(scenario.getAnswerNode('/data/repeat[1]/group/in_group')).toBeNonRelevant();

						scenario.removeRepeat('/data/repeat[2]');

						expect(scenario.getAnswerNode('/data/repeat[1]/group/in_group')).toBeRelevant();
					});
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
});
