import {
	bind,
	body,
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
import { Scenario, getRef } from '../src/jr/Scenario.ts';
import type { JRFormDef } from '../src/jr/form/JRFormDef.ts';

interface PredicateOptions {
	readonly oneBasedPositionPredicates: boolean;
}

describe('Interaction between `<repeat>` and `relevant`', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * While these tests are ported from JavaRosa's tests focusing on its
	 * `FormDef` class, we should consider migrating the tests to use equivalent
	 * APIs directly provided by {@link Scenario} rather than calling into our
	 * partially-equivalent {@link JRFormDef} (which is currently provided with
	 * the intent of completing test porting, but otherwise has no direct
	 * equivalent in our engine/client interfaces). For each test referencing
	 * those `FormDef` APIs:
	 *
	 * - If {@link Scenario} provides a clear analogue to those APIs, sufficient
	 *   to express the same semantics under test, an alternate test will be
	 *   included immediately following the test ported more directly from
	 *   JavaRosa
	 *
	 * - If no such analogue exists on {@link Scenario}, it will be called out
	 *   with additional notes (or a failing test if deemed appropriate).
	 */
	describe('FormDefTest.java', () => {
		describe('repeat relevance', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Rephrase?
			 */
			it('changes when dependent values of [`relevant`] relevance expression change', async () => {
				const scenario = await Scenario.init(
					'Repeat relevance - dynamic expression',
					html(
						head(
							title('Repeat relevance - dynamic expression'),
							model(
								mainInstance(
									t(
										'data id="repeat_relevance_dynamic"',
										t('selectYesNo', 'no'),
										t('repeat1', t('q1'))
									)
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

				const formDef = scenario.getFormDef();

				expect(formDef.isRepeatRelevant(getRef('/data/repeat1[1]'))).toBe(false);

				scenario.answer('/data/selectYesNo', 'yes');

				expect(formDef.isRepeatRelevant(getRef('/data/repeat1[1]'))).toBe(true);
			});

			it("updates a repeat instance's relevance state when the values of nodes referenced by its `relevant` expression are changed (non-`FormDef` alternate)", async () => {
				const scenario = await Scenario.init(
					'Repeat relevance - dynamic expression',
					html(
						head(
							title('Repeat relevance - dynamic expression'),
							model(
								mainInstance(
									t(
										'data id="repeat_relevance_dynamic"',
										t('selectYesNo', 'no'),
										t('repeat1', t('q1'))
									)
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

				expect(scenario.getInstanceNode('/data/repeat1[1]')).toBeNonRelevant();

				scenario.answer('/data/selectYesNo', 'yes');

				expect(scenario.getInstanceNode('/data/repeat1[1]')).toBeRelevant();
			});
		});

		describe('repeat', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Parameterized for 1-based predicates.
			 *
			 * Rephrase...?
			 *
			 * 1. ... "irrelevant" -> "non-relevant". In general, the former is a
			 *    colloquial phrase which has different implications than the spec
			 *    language around `relevant` (and that's why I've tended to use
			 *    "pertinent" and "impertinent" for that colloquial meaning, since
			 *    working with XForms-related technology).
			 *
			 * 2. ... to be more specific that this is a test about a static `false()`
			 *    expression. This isn't meaningful on its own, but would help to
			 *    distinguish the test from others (like the one immediately preceding
			 *    it) dealing with dynamic expressions and `relevant` state updates
			 *    caused by those dynamic expressions' dependency values changing.
			 */
			describe('[direct port (x2, parameterized for 1-based position predicates)/alternate pair]', () => {
				describe.each<PredicateOptions>([
					{ oneBasedPositionPredicates: false },
					{ oneBasedPositionPredicates: true },
				])(
					'one-based position predicates: $oneBasedPositionPredicates',
					({ oneBasedPositionPredicates }) => {
						let testFn: typeof it | typeof it.fails;

						if (oneBasedPositionPredicates) {
							testFn = it;
						} else {
							testFn = it.fails;
						}

						testFn(
							'is [non-relevant] irrelevant when [`relevant`] relevance [is a static `false()` expression] set to false',
							async () => {
								const scenario = await Scenario.init(
									'Repeat relevance - false()',
									html(
										head(
											title('Repeat relevance - false()'),
											model(
												mainInstance(t('data id="repeat_relevance_false"', t('repeat1', t('q1')))),
												bind('/data/repeat1').relevant('false()')
											)
										),
										body(repeat('/data/repeat1', input('/data/repeat1/q1')))
									)
								);

								const formDef = scenario.getFormDef();

								if (oneBasedPositionPredicates) {
									expect(formDef.isRepeatRelevant(getRef('/data/repeat1[1]'))).toBe(false);
								} else {
									expect(formDef.isRepeatRelevant(getRef('/data/repeat1[0]'))).toBe(false);
								}
							}
						);
					}
				);

				it('is non-relevant when a repeat node-set is bound with a static `relevant="false()"` expression (non-`FormDef` alternate)', async () => {
					const scenario = await Scenario.init(
						'Repeat relevance - false()',
						html(
							head(
								title('Repeat relevance - false()'),
								model(
									mainInstance(t('data id="repeat_relevance_false"', t('repeat1', t('q1')))),
									bind('/data/repeat1').relevant('false()')
								)
							),
							body(repeat('/data/repeat1', input('/data/repeat1/q1')))
						)
					);

					expect(scenario.getInstanceNode('/data/repeat1[1]')).toBeNonRelevant();
				});
			});

			describe('[instance] relevance', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * - Parameterized for 1-based predicates.
				 *
				 * - Rephrase?
				 */
				describe('[direct port (x2, parameterized for 1-based position predicates)/alternate pair]', () => {
					describe.each<PredicateOptions>([
						{ oneBasedPositionPredicates: false },
						{ oneBasedPositionPredicates: true },
					])(
						'one-based position predicates: $oneBasedPositionPredicates',
						({ oneBasedPositionPredicates }) => {
							let testFn: typeof it | typeof it.fails;

							if (oneBasedPositionPredicates) {
								testFn = it;
							} else {
								testFn = it.fails;
							}

							testFn(
								'changes when dependent values of grandparent [`relevant`] relevance expression change',
								async () => {
									const scenario = await Scenario.init(
										'Repeat relevance - dynamic expression',
										html(
											head(
												title('Repeat relevance - dynamic expression'),
												model(
													mainInstance(
														t(
															'data id="repeat_relevance_dynamic"',
															t('selectYesNo', 'no'),
															t('outer', t('inner', t('repeat1', t('q1'))))
														)
													),
													bind('/data/outer').relevant("/data/selectYesNo = 'yes'")
												)
											),
											body(
												select1('/data/selectYesNo', item('yes', 'Yes'), item('no', 'No')),
												repeat('/data/outer/inner/repeat1', input('/data/outer/inner/repeat1/q1'))
											)
										)
									);

									const formDef = scenario.getFormDef();

									if (oneBasedPositionPredicates) {
										expect(formDef.isRepeatRelevant(getRef('/data/outer/inner/repeat1[1]'))).toBe(
											false
										);
									} else {
										expect(formDef.isRepeatRelevant(getRef('/data/outer/inner/repeat1[0]'))).toBe(
											false
										);
									}

									scenario.answer('/data/selectYesNo', 'yes');

									if (oneBasedPositionPredicates) {
										expect(formDef.isRepeatRelevant(getRef('/data/outer/inner/repeat1[1]'))).toBe(
											true
										);
									} else {
										expect(formDef.isRepeatRelevant(getRef('/data/outer/inner/repeat1[0]'))).toBe(
											true
										);
									}
								}
							);
						}
					);

					it("updates a nested repeat instance's `relevant` state when the value of a `relevant` expression dependency outside the outer repeat changes (non-`FormDef` alternate)", async () => {
						const scenario = await Scenario.init(
							'Repeat relevance - dynamic expression',
							html(
								head(
									title('Repeat relevance - dynamic expression'),
									model(
										mainInstance(
											t(
												'data id="repeat_relevance_dynamic"',
												t('selectYesNo', 'no'),
												t('outer', t('inner', t('repeat1', t('q1'))))
											)
										),
										bind('/data/outer').relevant("/data/selectYesNo = 'yes'")
									)
								),
								body(
									select1('/data/selectYesNo', item('yes', 'Yes'), item('no', 'No')),
									repeat('/data/outer/inner/repeat1', input('/data/outer/inner/repeat1/q1'))
								)
							)
						);

						expect(scenario.getInstanceNode('/data/outer/inner/repeat1[1]')).toBeNonRelevant();

						scenario.answer('/data/selectYesNo', 'yes');

						expect(scenario.getInstanceNode('/data/outer/inner/repeat1[1]')).toBeRelevant();
					});
				});
			});

			/**
			 * **PORTING NOTES**
			 *
			 * - Parameterized for 1-based predicates.
			 *
			 * - Rephrase?
			 */
			describe('[direct port (x2, parameterized for 1-based position predicates)/alternate pair]', () => {
				describe.each<PredicateOptions>([
					{ oneBasedPositionPredicates: false },
					{ oneBasedPositionPredicates: true },
				])(
					'one-based position predicates: $oneBasedPositionPredicates',
					({ oneBasedPositionPredicates }) => {
						let testFn: typeof it | typeof it.fails;

						if (oneBasedPositionPredicates) {
							testFn = it;
						} else {
							testFn = it.fails;
						}

						testFn(
							'is [non-relevant] irrelevant when grandparent relevance set to false',
							async () => {
								const scenario = await Scenario.init(
									'Repeat relevance - false()',
									html(
										head(
											title('Repeat relevance - false()'),
											model(
												mainInstance(
													t(
														'data id="repeat_relevance_false"',
														t('outer', t('inner', t('repeat1', t('q1'))))
													)
												),
												bind('/data/outer').relevant('false()')
											)
										),
										body(repeat('/data/outer/inner/repeat1', input('/data/outer/inner/repeat1/q1')))
									)
								);

								const formDef = scenario.getFormDef();

								if (oneBasedPositionPredicates) {
									expect(formDef.isRepeatRelevant(getRef('/data/outer/inner/repeat1[1]'))).toBe(
										false
									);
								} else {
									expect(formDef.isRepeatRelevant(getRef('/data/outer/inner/repeat1[0]'))).toBe(
										false
									);
								}
							}
						);
					}
				);

				describe('nested repeat instance', () => {
					it('inherits the static non-relevant state of an ancestor repeat instnace (non-`FormDef` alternate)', async () => {
						const scenario = await Scenario.init(
							'Repeat relevance - false()',
							html(
								head(
									title('Repeat relevance - false()'),
									model(
										mainInstance(
											t(
												'data id="repeat_relevance_false"',
												t('outer', t('inner', t('repeat1', t('q1'))))
											)
										),
										bind('/data/outer').relevant('false()')
									)
								),
								body(repeat('/data/outer/inner/repeat1', input('/data/outer/inner/repeat1/q1')))
							)
						);

						expect(scenario.getInstanceNode('/data/outer/inner/repeat1[1]')).toBeNonRelevant();
					});
				});
			});
		});

		describe('nested repeat relevance', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * 1. Liberty was taken to omit a position predicate on a non-repeat node
			 *    in one of the ported assertions. While JavaRosa has a notion of
			 *    normalizing expressions (e.g. comparing
			 *    `/data/repeat[1]/non-repeat[1]` as equivalent to
			 *    `/data/repeat[1]/non-repeat`), the web forms engine interface does
			 *    not expose any such notion. This doesn't seem like an issue that
			 *    most clients should be concerned with, so it seems most reasonable
			 *    to port the assertion without requiring such a normalization. If
			 *    that assumption turns out to be wrong, we can revisit in the future.
			 *    The orignal assertion is commented directly above.
			 *
			 * 2. Failure anlaysis in some depth follows...
			 *
			 * - - -
			 *
			 * Fails with observed behavior that the second repeat instance's
			 * descendants never become relevant. As such, only the assertions before
			 * the value change fail.
			 *
			 * To keep the porting effort's momentum, I've generally tried to defer
			 * investigating any failure more deeply than gaining an understanding of
			 * the test case itself and hypothesizing the nature of the failure based
			 * on my understanding of engine behavior. However, this test was
			 * confusing enough (on first read) and its behavior surprising enough
			 * that I did a quick spike. Here's what I found (and some commentary):
			 *
			 * - The apparent root cause is that we are incorrectly evaluating repeat
			 *   instance `relevant` expressions in the context of both the repeat
			 *   instance itself (as expected) and its parent element (by mistake).
			 *
			 * - In a sense, this is a straightforward bug. It involves a clear (in
			 *   hindsight) logical error. It can be fixed with a relatively
			 *   straightforward special case.
			 *
			 * - In another sense, this is a symptom of a design flaw. There are
			 *   likely several very similar issues lurking with essentially the same
			 *   logical error (with at least one other which is clearly present in
			 *   exactly the same method, just for another bind expression).
			 *   Fundamentally, this bug (and others like it) are able to happen
			 *   because of the impedance mismatch between the engine's structural
			 *   model (wherein a "repeat range" is a thing that exists, and is
			 *   treated as a node with the same hierarchical qualities as any other)
			 *   and the engine's use of browser/XML DOM as an implementation of that.
			 *
			 * - This is an excellent example of the correctness implications of that
			 *   latter implementation detail, and a good one to consider as we think
			 *   about prioritization of an effort to move away from it.
			 *
			 * Note that even addressing the bug found above, this test would fail for
			 * another reason: we don't currently have a notion of determining
			 * relevance of a "repeat range" (and thus whether it should present a
			 * "prompt" event in JavaRosa/Scenario terms) by the relevance of its
			 * instances. There are other tests addressing this concern more directly,
			 * so it's likely we'll be able to target that issue with those. This is
			 * mostly meant as an observation that the two concerns intersect in this
			 * test even though it's not explicit.
			 */
			it.fails('updates based on parent position', async () => {
				const scenario = await Scenario.init(
					'Nested repeat relevance',
					html(
						head(
							title('Nested repeat relevance'),
							model(
								mainInstance(
									t(
										'data id="nested-repeat-relevance"',
										t('outer', t('inner', t('q1')), t('inner', t('q1'))),
										t('outer', t('inner', t('q1'))),
										t('relevance-condition', '0')
									)
								),
								bind('/data/relevance-condition').type('string'),
								bind('/data/outer/inner').relevant('position(..) mod 2 = /data/relevance-condition')
							)
						),
						body(
							repeat('/data/outer', repeat('/data/outer/inner', input('/data/outer/inner/q1'))),
							input('/data/relevance-condition')
						)
					)
				);

				scenario.next('/data/outer[1]');

				// JR:
				//
				// For ref /data/outer[1]/inner[1], the parent position is 1 so the
				// boolean expression is false. That means none of the inner groups in
				// /data/outer[1] can be relevant.
				expect(scenario.refAtIndex()).toEqualTreeReference(getRef('/data/outer[1]'));

				scenario.next('/data/outer[2]');

				expect(scenario.refAtIndex()).toEqualTreeReference(getRef('/data/outer[2]'));

				scenario.next('/data/outer[2]/inner[1]');

				expect(scenario.refAtIndex()).toEqualTreeReference(getRef('/data/outer[2]/inner[1]'));

				scenario.next('/data/outer[2]/inner[1]/q1');

				// assertThat(scenario.refAtIndex(), is(getRef("/data/outer[2]/inner[1]/q1[1]")));
				expect(scenario.refAtIndex()).toEqualTreeReference(getRef('/data/outer[2]/inner[1]/q1'));

				scenario.answer('/data/relevance-condition', '1');

				scenario.jumpToBeginningOfForm();

				scenario.next('/data/outer[1]');

				expect(scenario.refAtIndex()).toEqualTreeReference(getRef('/data/outer[1]'));

				scenario.next('/data/outer[1]/inner[1]');

				expect(scenario.refAtIndex()).toEqualTreeReference(getRef('/data/outer[1]/inner[1]'));
			});
		});

		/**
		 * **PORTING NOTES**
		 *
		 * - Rephrase?
		 *
		 * - This seems to be testing implementation detail of the `FormDef`
		 *   interface itself. We do not have an equivalent for determining
		 *   [non-]relevance of a node that doesn't even exist. It's unclear
		 *   whether/why we would want to implement that.
		 */
		describe('inner repeat [~~]group[~~]', () => {
			it.fails(
				'is [non-relevant] irrelevant when its parent repeat [~~]group[~~] does not exist',
				async () => {
					const scenario = await Scenario.init(
						'Nested repeat relevance',
						html(
							head(
								title('Nested repeat relevance'),
								model(
									mainInstance(
										t('data id="nested-repeat-relevance"', t('outer', t('inner', t('q1'))))
									)
								)
							),
							body(
								repeat('/data/outer', repeat('/data/outer/inner', input('/data/outer/inner/q1')))
							)
						)
					);

					const formDef = scenario.getFormDef();

					// JR:
					//
					// outer[2] does not exist at this moment, we only have outer[1].
					// Checking if its inner repeat group is relevant should be possible
					// and return false.
					expect(formDef.isRepeatRelevant(getRef('/data/outer[2]/inner[1]'))).toBe(false);
				}
			);
		});
	});
});
