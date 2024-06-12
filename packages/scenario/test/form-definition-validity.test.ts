import type { BindBuilderXFormsElement } from '@getodk/common/test/fixtures/xform-dsl/BindBuilderXFormsElement.ts';
import type { XFormsElement } from '@getodk/common/test/fixtures/xform-dsl/XFormsElement.ts';
import {
	bind,
	body,
	group,
	head,
	html,
	input,
	mainInstance,
	model,
	repeat,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { intAnswer } from '../src/answer/ExpectedIntAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';

/**
 * **PORTING NOTES**
 *
 * JavaRosa's error condition assertions have little in common with those we
 * have available in Vitest. Some liberties have been taken to preserve the
 * apparent semantic intent of tests checking for error conditions, with
 * JavaRosa's equivalents preserved but commented out where appropriate.
 */
describe('TriggerableDagTest.java', () => {
	describe('//region Cycles', () => {
		const buildFormForDagCyclesCheck = (
			initialValueOrFirstBind: BindBuilderXFormsElement | string | null,
			...rest: BindBuilderXFormsElement[]
		): XFormsElement => {
			let initialValue: string | null;
			let binds: readonly BindBuilderXFormsElement[];

			if (typeof initialValueOrFirstBind === 'string' || initialValueOrFirstBind == null) {
				initialValue = initialValueOrFirstBind;
				binds = rest;
			} else {
				initialValue = null;
				binds = [initialValueOrFirstBind, ...rest];
			}

			// Map the last part of each bind's nodeset to model fields
			// They will get an initial value if provided
			const modelFields = binds
				// eslint-disable-next-line @typescript-eslint/no-shadow
				.map((bind) => {
					const parts = bind.getNodeset().split('/');

					/**
					 * **PORTING NOTES**
					 *
					 * Slight deviation from JR for null safety
					 */
					const name = parts[parts.length - 1];
					if (name == null) {
						throw new Error(`Unexpected bind nodeset: ${bind.getNodeset()}`);
					}

					return name;
				})
				.map((name) => {
					if (initialValue == null) {
						return t(name);
					}

					return t(name, initialValue);
				});

			/**
			 * **PORTING NOTES**
			 *
			 * Java language oddity? JavaRosa uses `mainInstance = mainInstance(...)`?!
			 *
			 * TIL: Java allows calling an imported method name while also defining a
			 * local variable binding which shadows name of the method being called to
			 * define it! Maybe in review someone can satisfy my curiosity about
			 * whether that's a context-sensitive thing (Is it distinguished by call
			 * versus reference syntax? Does the binding not exist yet, and the name
			 * references only the binding after it occurs?), or some much more
			 * complex language grammar thing.
			 *
			 * In any case, we need another name for the local binding otherwise this
			 * would fail by attempting to call itself in its own definition.
			 */
			const mainInstance_ = mainInstance(t('data id="some-form"', ...modelFields));

			// Build the model including the main instance we've just built and the provided binds
			const modelChildren: readonly XFormsElement[] = [mainInstance_, ...binds];

			// Map each bind's nodeset to body fields (inputs)
			// eslint-disable-next-line @typescript-eslint/no-shadow
			const inputs = binds.map((bind) => bind.getNodeset()).map((name) => input(name));

			// Return the complete form including model fields, binds, and body inputs
			return html(head(title('Some form'), model(...modelChildren)), body(...inputs));
		};

		describe('parsing forms with cycles', () => {
			describe('by self reference in calculate', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * We don't currently have explicit cycle detection. We did previously,
				 * but it was recently removed, as we were able to realize an earlier
				 * hypothetical goal to push more graph-specific logic into reactivity
				 * (which itself implements a DAG, albeit more generically).
				 *
				 * Porting this test faithfully, by checking the error message it
				 * produces, would suggest a greater behavioral divergence between
				 * JavaRosa and web forms than presently exists. As such, this current
				 * test is marked failing to demonstrate that.
				 *
				 * A supplementary test follows, which relaxes the error message check
				 * to demonstrate that loading the form _does fail as expected_.
				 *
				 * Note that while we don't yet intentionally implement error messaging
				 * for this scenario, it will certainly be a case we want to message
				 * clearly. It'll be interesting to think about how we might achieve
				 * that… even if it means reintroducing upfront cycle detection, which
				 * would ultimately be redundant beyond the error messaging use case.
				 */
				it.fails('should fail', async () => {
					// exceptionRule.expect(XFormParseException.class);
					// exceptionRule.expectMessage("Cycle detected in form's relevant and calculation logic!");

					const init = async () => {
						await Scenario.init(
							'Some form',
							buildFormForDagCyclesCheck(bind('/data/count').type('int').calculate('. + 1'))
						);
					};

					await expect(init).rejects.toThrow(
						"Cycle detected in form's relevant and calculation logic!"
					);
				});

				/**
				 * **PORTING NOTES**
				 *
				 * This test is supplementary to the one more faithfully ported from
				 * JavaRosa above (and that test's porting notes explain the reasoning
				 * for this in detail).
				 *
				 * Specific details of this test:
				 *
				 * 1. It seemed redundant to preserve (commented out) JavaRosa's
				 *    different approach to error condition assertions. But if we decide
				 *    that those commented out lines may be valuable for future
				 *    maintenance (i.e. as an aid to synchronization with JavaRosa), and
				 *    if we also decide that this supplemental test is suitable to stand
				 *    in for the more faithful port, we may want to move those lines
				 *    into this test before removing the other.
				 *
				 * 2. A first pass had included a check for the actual error message
				 *    that's currently produced. The thinking was that, since the error
				 *    is currently expected but doesn't express the specific intent, we
				 *    could at least have some additional intent **here** by making the
				 *    test a bit more brittle (as a reminder that the user-facing intent
				 *    is unaddressed). Unfortunately, each of our supported test
				 *    environments currently produces a different error message. So for
				 *    now, we just check that an error is produced at all.
				 */
				it.fails(
					'should fail (supplementary/alternate test with bogus error message check)',
					async () => {
						const init = async () => {
							await Scenario.init(
								'Some form',
								buildFormForDagCyclesCheck(bind('/data/count').type('int').calculate('. + 1'))
							);
						};

						await expect(init).rejects.toThrow();
					}
				);
			});

			/**
			 * **PORTING NOTES**
			 *
			 * With the above tests demonstrating two approaches to porting JavaRosa's
			 * cycle detection tests, each remaining cycle detection test will
			 * collapse both approaches into a single ported test, with JavaRosa's
			 * error checks commented out, and a relaxed error check actually
			 * executed. (Some variance in the approach to error checking may be
			 * necessary, as is the case for the first test in this suite. A note will
			 * be included whenever such variation becomes necessary.)
			 */
			describe('in calculate', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * 0. This test uses a less idiomatic error condition assertion. For
				 *    some reason, rather than failing, Vitest hangs indefinitely on a
				 *    `rejects.toThrow` assertion (it never even times out; but I
				 *    suspect we'd need a cancelable `Promise` implementation to be able
				 *    to work around that).
				 *
				 * 1. This is the first big surprise to come up in the porting effort! I
				 *    would very much have expected Solid's reactivity to produce some
				 *    kind of error for this cycle. Since it doesn't, it seems we will
				 *    definitely need upfront cycle detection logic.
				 *
				 * 2. It's not immediately clear if this surprise indicates any (or some
				 *    combination) of:
				 *
				 *    - an actual bug (logic error) in the way web forms currently sets
				 *      up the form's computations
				 *
				 *    - some aspect of Solid's internal graph logic which allows for
				 *      cycles to short circuit under some circumstances
				 *
				 * 3. What the actual form definition produces is `NaN` for each field.
				 *    It also produces that even if each field has a default value. I'm
				 *    super curious to investigate this further, as I would have
				 *    expected, if there is some form of short circuiting happening, for
				 *    one or more default values to be preserved (and even perhaps for
				 *    one or more of the calculations to succeed).
				 *
				 * 4. In hindsight, thinking about the implications of that last point,
				 *    **of course** we still want explicit cycle detection: an
				 *    inherently invalid form definition should fail fast, without ever
				 *    being able to reach some invalid but partially complete loading
				 *    state.
				 */
				it.fails('should fail', async () => {
					// exceptionRule.expect(XFormParseException.class);
					// exceptionRule.expectMessage("Cycle detected in form's relevant and calculation logic!");

					let caught: unknown = null;

					try {
						await Scenario.init(
							'Some form',
							buildFormForDagCyclesCheck(
								bind('/data/a').type('int').calculate('/data/b + 1'),
								bind('/data/b').type('int').calculate('/data/c + 1'),
								bind('/data/c').type('int').calculate('/data/a + 1')
							)
						);
					} catch (error) {
						caught = error;
					}

					expect(caught).toBeInstanceOf(Error);
				});
			});

			/**
			 * **PORTING NOTES**
			 *
			 * It appears there are several tests of a similar shape, for each
			 * applicable expression. We may want to condense them into a
			 * parameterized ("table") test?
			 */
			describe('by self reference in relevance', () => {
				it.fails('should fail', async () => {
					// exceptionRule.expect(XFormParseException.class);
					// exceptionRule.expectMessage("Cycle detected in form's relevant and calculation logic!");

					const init = async () => {
						await Scenario.init(
							'Some form',
							buildFormForDagCyclesCheck(bind('/data/count').type('int').relevant('. > 0'))
						);
					};

					await expect(init).rejects.toThrow();
				});
			});

			describe('by self reference in `readonly` condition', () => {
				it.fails('should fail', async () => {
					// exceptionRule.expect(XFormParseException.class);
					// exceptionRule.expectMessage("Cycle detected in form's relevant and calculation logic!");

					const init = async () => {
						await Scenario.init(
							'Some form',
							buildFormForDagCyclesCheck(bind('/data/count').type('int').readonly('. > 10'))
						);
					};

					await expect(init).rejects.toThrow();
				});
			});

			describe('by self reference in required condition', () => {
				it.fails('should fail', async () => {
					// 	exceptionRule.expect(XFormParseException.class);
					// exceptionRule.expectMessage("Cycle detected in form's relevant and calculation logic!");

					const init = async () => {
						await Scenario.init(
							'Some form',
							buildFormForDagCyclesCheck(bind('/data/count').type('int').required('. > 10'))
						);
					};

					await expect(init).rejects.toThrow();
				});
			});
		});

		/**
		 * **PORTING NOTES**
		 *
		 * In general, the `describe` and `it` descriptions have been intentionally
		 * kept as close to JavaRosa's text as seems reasonable. This description is
		 * added for clarity to group the directly ported test with supplemental
		 * tests added with it.
		 */
		describe('cycles in `constraint`', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * It took some time to really grasp the intent _and behavior_ of this test.
			 * Below captures my descent into madness as I came to understand it.
			 *
			 * It turns out that the test _is validating constraint behavior_—that
			 * JavaRosa's constraint behavior blocks the assignment of
			 * constraint-violating values, and preserves whatever previous value did
			 * not violate the constraint. Briefly, I think:
			 *
			 * 1. The below commentary about breaking up the test still apply.
			 * 2. This would also clarify, organizationally, where we might want to put
			 *    an equivalent test focused only on the effect of constraint behavior
			 *    on values.
			 * 3. My initial instinct is that we should seriously reconsider the
			 *    value-specific aspects of this behavior, at the very least to provide
			 *    additional nuance to help users reconcile invalid values they might
			 *    enter. It makes some sense that we'd want to help guide users not to
			 *    produce invalid values in the first place. It's unclear that
			 *    preserving a previously valid value, and completely discarding the
			 *    invalid value entered later, would provide a good user experience.
			 * 4. With that said, this is only a narrow slice into all of the potential
			 *    state that might be set by the test's "act" steps. It's entirely
			 *    possible that there are other nuances in how JavaRosa addresses the
			 *    user experience around user provided constraint-violating values.
			 * 5. Several observations below are clearly incorrect, in hindsight. I
			 *    think there's value in preserving them, in all their incorrectness, as
			 *    I think it might help inform discussion of what we actually want the
			 *    engine's behavior to accomplish for scenarios like this.
			 *
			 * - - -
			 *
			 * - As with several other tests, the assertion that an answer will match
			 *   `nullValue()` is commented out, and replaced with a blank value check.
			 *
			 * - 🚨🚨🚨 This is marked as failing, but it seems like some aspect of the
			 *   test itself must be wrong! The aforementioned substitution of a blank
			 *   value check in place of JavaRosa's `nullValue()` check... fails. **As
			 *   it should!** The "act" step immediately preceding it sets the value to
			 *   `5`, so it cannot be blank. It's entirely unclear how it anything about
			 *   the question's "answer" (in JavaRosa `Scenario`/related semantics)
			 *   could successfully match against `nullValue()`. This calls into
			 *   question _every substitution_ of `assertThat(scenario.answerOf(...),
			 *   is(nullValue()))` (or other logically equivalent variants; we should be
			 *   cautious if we determine there should be some cross-cutting change to
			 *   how we've ported this pattern, as a naive find in project will likely
			 *   miss several cases).
			 *
			 * - 🚨🚨🚨🚨🚨🚨🚨🚨🚨 The last assertion also makes no sense at all. The
			 *   expected value **should be** 5. Maybe this doesn't call into question
			 *   any of the `nullValue()` answer substitutions at all! Is my
			 *   understanding of these assertions correct (that the assertions
			 *   themselves **must be wrong**), and somehow JavaRosa is just... not
			 *   executing them? Swallowing their failures for some other reason?
			 *
			 * - This should likely be two tests:
			 *
			 *    1. Precisely what the test description says. This isn't actually
			 *       asserted. Asserting it would look similar to the above, but not
			 *       expecting initialization to fail/reject/throw. It's only implicitly
			 *       checked by not producing an error in the rest of the test body.
			 *    2. The rest of the test logic after init, which appears to exercise
			 *       basic value assignment.
			 *
			 * Given all of the above [post hoc clarification: "all of the above" here
			 * referred to everything following "- - -"], two supplementary/alternative
			 * tests follow. The first should address the intent of this test's
			 * description. The second, if it should exist at all, should probably go
			 * somewhere else; and hopefully it can also serve at least to clarify what
			 * we should do about `nullValue()` checks compared to answer lookups.
			 */
			it.fails('supports self references in constraints', async () => {
				const scenario = await Scenario.init(
					'Some form',
					buildFormForDagCyclesCheck(bind('/data/count').type('int').constraint('. > 10'))
				);

				scenario.next('/data/count');
				scenario.answer(5);

				// assertThat(scenario.answerOf("/data/count"), is(nullValue()));
				expect(scenario.answerOf('/data/count').getValue()).toBe('');

				scenario.answer(20);

				expect(scenario.answerOf('/data/count')).toEqualAnswer(intAnswer(20));

				scenario.answer(5);

				expect(scenario.answerOf('/data/count')).toEqualAnswer(intAnswer(20));
			});

			it('supports self references in constraints (supplemental/alternate #1)', async () => {
				let caught: unknown = null;

				try {
					await Scenario.init(
						'Some form',
						buildFormForDagCyclesCheck(bind('/data/count').type('int').constraint('. > 10'))
					);
				} catch (error) {
					caught = error;
				}

				expect(caught).toBeNull();
			});

			it.fails(
				"supports self references in constraints [and subsequent value assignments, where permitted by the field's `constraint` expression] (supplemental/alternate #2)",
				async () => {
					const scenario = await Scenario.init(
						'Some form',
						buildFormForDagCyclesCheck(bind('/data/count').type('int').constraint('. > 10'))
					);

					scenario.next('/data/count');
					scenario.answer(5);

					// assertThat(scenario.answerOf("/data/count"), is(nullValue()));
					// 🚨🚨🚨
					expect(scenario.answerOf('/data/count').getValue()).toBe('');
					// 🚨🚨🚨

					expect(scenario.answerOf('/data/count')).toEqualAnswer(intAnswer(5));

					scenario.answer(20);

					expect(scenario.answerOf('/data/count')).toEqualAnswer(intAnswer(20));

					scenario.answer(5);

					expect(scenario.answerOf('/data/count')).toEqualAnswer(intAnswer(20));
				}
			);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * 0. This describe block is also introduced without JavaRosa precedent, in
		 *    this case to group several tests clearly exercising related
		 *    functionality across multiple expressions. This may also be a good
		 *    candidate for parameterized ("table") tests.
		 *
		 * 1. The trailing comment in each test body (preserved from JavaRosa,
		 *    suggesting there should be additional assertions) seems questionable.
		 *    Form initialization is the behavior under test. If there are
		 *    additional behaviors to test for those forms, it would seem more
		 *    appropriate to add them in separate tests (if those behaviors aren't
		 *    already exercised in separate tests).
		 *
		 * 2. While each of these tests is currently ignored in JavaRosa, they're
		 *    all passing here! The first test's _leading comment_ is also preserved
		 *    from JavaRosa, which explains the reasoning behind the test and its
		 *    current failure mode. Similar leading comments on the other tests in
		 *    this sub-suite have been omitted here, as they're basically redundant
		 *    and non-applicable.
		 *
		 * 3. It's highly likely that these tests would also have failed, prior to
		 *    {@link https://github.com/getodk/web-forms/pull/67 | recent changes to rely more on reactivity for graph logic}.
		 *    This is something we should keep in mind as we consider how we might
		 *    address gaps in cycle detection.
		 */
		describe('"codependant" expressions', () => {
			/**
			 * JR:
			 *
			 * This test is here to represent a use case that might seem like it
			 * has a cycle, but it doesn't.
			 * <p>
			 * This test is ignored because the current implementation incorrectly
			 * detects a cycle given the relevance conditions we have used. Once
			 * this is fixed, this test would be a regression test to ensure we
			 * never rollback on the fix.
			 * <p>
			 * The relevance conditions used here a co-dependant(field a depends
			 * on b, b depends on a), but they depend on the field's value, not on
			 * the field's relevance expression. This is why there's no cycle here.
			 * <p>
			 * To have a cycle using relevance conditions exclusively, we would need
			 * a isRelevant() xpath function that doesn't exist and change the revelance
			 * expressions to:
			 *
			 * <code>
			 * bind("/data/a").type("int").relevant("isRelevant(/data/b) > 0")
			 * bind("/data/b").type("int").relevant("isRelevant(/data/a) > 0")
			 * </code>
			 */
			it('supports codependant relevant conditions', async () => {
				await Scenario.init(
					'Some form',
					buildFormForDagCyclesCheck(
						bind('/data/a').type('int').relevant('/data/b > 0'),
						bind('/data/b').type('int').relevant('/data/a > 0')
					)
				);
			});

			it('supports codependant required conditions', async () => {
				await Scenario.init(
					'Some form',
					buildFormForDagCyclesCheck(
						bind('/data/a').type('int').required('/data/b > 0'),
						bind('/data/b').type('int').required('/data/a > 0')
					)
				);
			});

			it('supports codependant readonly conditions', async () => {
				await Scenario.init(
					'Some form',
					buildFormForDagCyclesCheck(
						bind('/data/a').type('int').readonly('/data/b > 0'),
						bind('/data/b').type('int').readonly('/data/a > 0')
					)
				);
			});
		});

		/**
		 * Sub-suite block has no JavaRosa precedent, added for improved grouping.
		 */
		describe('repeats', () => {
			describe('parsing forms with cycles, involving fields inside and outside of repeat groups', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * Same notes as previous (then surprising) failure of cycle detecction.
				 * At least we have a pattern!
				 */
				it.fails('should fail', async () => {
					// exceptionRule.expect(XFormParseException.class);
					// exceptionRule.expectMessage("Cycle detected in form's relevant and calculation logic!");

					let caught: unknown = null;

					try {
						await Scenario.init(
							'Some form',
							html(
								head(
									title('Some form'),
									model(
										mainInstance(t('data id="some-form"', t('group', t('a', '1')), t('b', '1'))),
										bind('/data/group/a').type('int').calculate('/data/b + 1'),
										bind('/data/b').type('int').calculate('/data/group[position() = 1]/a + 1')
									)
								),
								body(
									group('/data/group', repeat('/data/group', input('/data/group/a'))),
									input('/data/b')
								)
							)
						);
					} catch (error) {
						caught = error;
					}

					expect(caught).toBeInstanceOf(Error);
				});
			});

			describe('parsing forms with self reference cycles in fields of repeat groups', () => {
				it('should fail', async () => {
					// exceptionRule.expect(XFormParseException.class);
					// exceptionRule.expectMessage("Cycle detected in form's relevant and calculation logic!");

					const init = async () => {
						await Scenario.init(
							'Some form',
							html(
								head(
									title('Some form'),
									model(
										mainInstance(t('data id="some-form"', t('group', t('a', '1')))),
										bind('/data/group/a').type('int').calculate('../a + 1')
									)
								),
								body(group('/data/group', repeat('/data/group', input('/data/group/a'))))
							)
						);
					};

					await expect(init).rejects.toThrow();
				});
			});

			/**
			 * **PORTING NOTES**
			 *
			 * While ignored in JavaRosa, this passes with the web forms engine as
			 * expected! Same caveats apply from other cycle tests ignored in JavaRosa
			 * which pass here.
			 *
			 * - - -
			 *
			 * JR:
			 *
			 * This test fails to parse the form because it thinks there's a
			 * self-reference cycle in /data/group/a, but this would be incorrect
			 * because each it depends on the same field belonging to the previous
			 * repeat instance, which wouldn't be a cycle, but an autoincremental
			 * feature.
			 */
			it('supports self-reference dependency when targeting different repeat instance siblings', async () => {
				await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('group', t('a', '1')))),
								bind('/data/group/a')
									.type('int')
									.calculate('/data/group[position() = (position(current()) - 1)]/a + 1')
							)
						),
						body(group('/data/group', repeat('/data/group', input('/data/group/a'))))
					)
				);
			});

			describe('parsing forms with cycles between fields of the same repeat instance', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * Same notes as previous (then surprising) failure of cycle detecction.
				 * At least we have a pattern!
				 */
				it.fails('should fail', async () => {
					// 	exceptionRule.expect(XFormParseException.class);
					// exceptionRule.expectMessage("Cycle detected in form's relevant and calculation logic!");

					let caught: unknown = null;

					try {
						await Scenario.init(
							'Some form',
							html(
								head(
									title('Some form'),
									model(
										mainInstance(t('data id="some-form"', t('group', t('a', '1'), t('b', '1')))),
										bind('/data/group/a').type('int').calculate('../b + 1'),
										bind('/data/group/b').type('int').calculate('../a + 1')
									)
								),
								body(
									group(
										'/data/group',
										repeat('/data/group', input('/data/group/a'), input('/data/group/b'))
									)
								)
							)
						);
					} catch (error) {
						caught = error;
					}

					expect(caught).toBeInstanceOf(Error);
				});
			});
		});
	});
});
