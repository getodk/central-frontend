import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	repeat,
	setvalue,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { intAnswer } from '../src/answer/ExpectedIntAnswer.ts';
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';
import { CapturingRecordAudioActionListener } from '../src/audio/CapturingRecordAudioActionListener.ts';
import { RecordAudioActions } from '../src/audio/RecordAudioActions.ts';
import { Scenario, getRef } from '../src/jr/Scenario.ts';
import type { JRFormDef } from '../src/jr/form/JRFormDef.ts';
import { r } from '../src/jr/resource/ResourcePathHelper.ts';

interface PredicateOptions {
	readonly oneBasedPositionPredicates: boolean;
}

/**
 * **PORTING NOTES**
 *
 * Actions/events are currently unsupported. All tests are expected to fail, and
 * will be ported as a best effort, without much else to note unless there are
 * surprises in the porting process.
 */
describe('Actions/Events', () => {
	describe('InstanceLoadEventsTest.java', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * - I definitely think we should rephrase this one (and any in general
		 *   where we have the full power of strings to reference particular aspects
		 *   of spec; as such, same note applies for other applicable events).
		 *
		 * - TIL there's a `odk-instance-load` event! It's different from
		 *   `odk-instance-first-load`! 🤯
		 *
		 * - Some brief archaeology reveals
		 *   {@link https://forum.getodk.org/t/form-spec-proposal-add-background-audio-recording/31889/21 | this form post}
		 *   which appears to introduce the concept. It also strongly suggests the
		 *   event has/should have semantics similar (or identical?) to the W3C
		 *   standard `xforms-read` event. The language of the
		 *   {@link https://getodk.github.io/xforms-spec/#events | ODK spec} regards
		 *   _that event_ as deprecated, and I see no mention of this
		 *   apparently-equivalent event.
		 *
		 * - Do... we want to support this?
		 *
		 * - If we **don't expect to support it**, we should determine which of
		 *   these tests should have a corresponding `odk-instance-first-load` test.
		 *
		 * - If we do, and if it's actually identical in semantics to
		 *   `xforms-ready`, it's probably worth considering that as the canonical
		 *   event name and `odk-instance-load` as an alias.
		 */
		describe('[odk-instance-load] instance load event', () => {
			it.fails('fires event on first load', async () => {
				const scenario = await Scenario.init(
					'Instance load form',
					html(
						head(
							title('Instance load form'),
							model(
								mainInstance(t('data id="instance-load-form"', t('q1'))),
								bind('/data/q1').type('int'),
								setvalue('odk-instance-load', '/data/q1', '4*4')
							)
						),
						body(input('/data/q1'))
					)
				);

				expect(scenario.answerOf('/data/q1')).toEqualAnswer(intAnswer(16));
			});

			it.fails('fires on second load', async () => {
				const scenario = await Scenario.init(
					'Instance load form',
					html(
						head(
							title('Instance load form'),
							model(
								mainInstance(t('data id="instance-load-form"', t('q1'))),
								bind('/data/q1').type('int'),
								setvalue('odk-instance-load', '/data/q1', '4*4')
							)
						),
						body(input('/data/q1'))
					)
				);

				expect(scenario.answerOf('/data/q1')).toEqualAnswer(intAnswer(16));

				scenario.answer('/data/q1', 555);

				const restored = await scenario.serializeAndDeserializeForm();

				expect(restored.answerOf('/data/q1')).toEqualAnswer(intAnswer(16));
			});

			/**
			 * **PORTING NOTES**
			 *
			 * - Equivalent test for `odk-instance-first-load`?
			 *
			 * - (At least for now), typical `nullValue()` -> blank/empty string check
			 */
			it.fails('triggers nested actions', async () => {
				const scenario = await Scenario.init(
					'Nested instance load',
					html(
						head(
							title('Nested instance load'),
							model(
								mainInstance(t('data id="nested-instance-load"', t('repeat', t('q1')))),
								bind('/data/repeat/q1').type('string')
							)
						),
						body(
							repeat(
								'/data/repeat',
								setvalue('odk-instance-load', '/data/repeat/q1', '4*4'),
								input('/data/repeat/q1')
							)
						)
					)
				);

				expect(scenario.answerOf('/data/repeat[1]/q1')).toEqualAnswer(stringAnswer('16'));

				scenario.createNewRepeat('/data/repeat');

				expect(scenario.answerOf('/data/repeat[2]/q1').getValue()).toBe('');
			});

			/**
			 * **PORTING NOTES**
			 *
			 * - Equivalent test for `odk-instance-first-load`?
			 *
			 * - Insofar as there are several equivalents (and insofar as we may want
			 *   to expand actions testing after porting/in the course of feature
			 *   implementation), a parameterized/table test may be a good option.
			 *
			 * - (At least for now), typical `nullValue()` -> blank/empty string check
			 */
			it.fails('[is] triggered for all pre-existing repeat instances', async () => {
				const scenario = await Scenario.init(
					'Nested instance load',
					html(
						head(
							title('Nested instance load'),
							model(
								mainInstance(
									t('data id="nested-instance-load"', t('repeat', t('q1')), t('repeat', t('q1')))
								),
								bind('/data/repeat/q1').type('string')
							)
						),
						body(
							repeat(
								'/data/repeat',
								setvalue('odk-instance-load', '/data/repeat/q1', '4*4'),
								input('/data/repeat/q1')
							)
						)
					)
				);

				expect(scenario.answerOf('/data/repeat[1]/q1')).toEqualAnswer(stringAnswer('16'));
				expect(scenario.answerOf('/data/repeat[2]/q1')).toEqualAnswer(stringAnswer('16'));

				scenario.createNewRepeat('/data/repeat');

				expect(scenario.answerOf('/data/repeat[3]/q1').getValue()).toBe('');
			});
		});

		describe('[odk-instance-first-load] instance first load event', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * To the extent we will have a conceptual equivalent to "second load",
			 * this test does imply that we would probably have reasons besides
			 * offline to consider form serialization (or otherwise we'll want to
			 * rethink this test's "act" phase).
			 */
			it.fails('does not fire on second load', async () => {
				const scenario = await Scenario.init(
					'Instance load form',
					html(
						head(
							title('Instance load form'),
							model(
								mainInstance(t('data id="instance-load-form"', t('q1'))),
								bind('/data/q1').type('int'),
								setvalue('odk-instance-first-load', '/data/q1', '4*4')
							)
						),
						body(input('/data/q1'))
					)
				);

				expect(scenario.answerOf('/data/q1')).toEqualAnswer(intAnswer(16));

				scenario.answer('/data/q1', 555);

				const restored = await scenario.serializeAndDeserializeForm();

				expect(restored.answerOf('/data/q1')).toEqualAnswer(intAnswer(555));
			});
		});
	});

	describe('MultipleEventsTest.java', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * `getDisplayText` -> `getValue`, as there doesn't appear to be any
		 * difference in expected semantics. Original usage is commented above each
		 * converted case.
		 */
		describe('nested [odk-instance-first-load] first load event', () => {
			it.fails('sets [the] value', async () => {
				const scenario = await Scenario.init('multiple-events.xml');

				// assertThat(scenario.answerOf("/data/nested-first-load").getDisplayText(), is("cheese"));
				expect(scenario.answerOf('/data/nested-first-load').getValue()).toBe('cheese');
			});

			describe('in group', () => {
				it.fails('sets [the] value', async () => {
					const scenario = await Scenario.init('multiple-events.xml');

					// assertThat(scenario.answerOf("/data/my-group/nested-first-load-in-group").getDisplayText(), is("more cheese"));
					expect(scenario.answerOf('/data/my-group/nested-first-load-in-group').getValue()).toBe(
						'more cheese'
					);
				});
			});
		});

		describe('serialized and deserialized nested [odk-instance-first-load] first load event', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Fails on all of serde, new instance, assertion of the expected value
			 *   from the `setvalue` action/`odk-instance-first-load` event
			 *
			 * - In general, if we determine a test is pertinent with
			 *   `serializeAndDeserializeForm` followed by `newInstance`, it probably
			 *   makes sense for `newInstance` to actually return a new instance
			 *   (presumably itself producing a new **instance of `Scenario`**). We
			 *   should consider a followup introducing that `Scenario` API change,
			 *   with tests updated to reference the instance it produces rather than
			 *   mutating the deserialized `Scenario`.
			 *
			 * - We should also do a full pass to ensure that pattern holds. If there
			 *   are other cases of `newInstance` which don't first
			 *   `serializeAndDeserialize`, we'll want to ensure they similarly
			 *   reference a newly produced instance.
			 *
			 * - While we're at it, let's consider striking that `And` from the serde
			 *   method, and have both `serialize`/`deserialize` methods (the former
			 *   producing a serialized value, the latter probably a static method
			 *   accepting that serialized value).
			 */
			it.fails('sets [the] value', async () => {
				const scenario = await Scenario.init('multiple-events.xml');

				const deserializedScenario = await scenario.serializeAndDeserializeForm();

				await deserializedScenario.newInstance();

				// assertThat(deserializedScenario.answerOf("/data/nested-first-load").getDisplayText(), is("cheese"));
				expect(deserializedScenario.answerOf('/data/nested-first-load').getValue()).toBe('cheese');
			});

			describe('in group', () => {
				it.fails('sets [the] value', async () => {
					const scenario = await Scenario.init('multiple-events.xml');

					const deserializedScenario = await scenario.serializeAndDeserializeForm();

					await deserializedScenario.newInstance();

					// assertThat(deserializedScenario.answerOf("/data/my-group/nested-first-load-in-group").getDisplayText(), is("more cheese"));
					expect(
						deserializedScenario.answerOf('/data/my-group/nested-first-load-in-group').getValue()
					).toBe('more cheese');
				});
			});
		});

		describe('nested [odk-instance-first-load] first load and [xforms-value-changed] value changed events', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * It may also make more sense to rephrase all of the permutations of
			 * `setsValue` to both reference `setvalue` (per spec) **and** provide a
			 * consistent BDD-ish `it [...]` test description format.
			 */
			it.fails('set[s the] value', async () => {
				const scenario = await Scenario.init('multiple-events.xml');

				// assertThat(scenario.answerOf("/data/my-calculated-value").getDisplayText(), is("10"));
				expect(scenario.answerOf('/data/my-calculated-value').getValue()).toBe('10');

				scenario.answer('/data/my-value', '15');

				// assertThat(scenario.answerOf("/data/my-calculated-value").getDisplayText(), is("30"));
				expect(scenario.answerOf('/data/my-calculated-value').getValue()).toBe('30');
			});
		});

		describe('serialized and deserialized nested [odk-instance-first-load] first load and [xforms-value-changed] value changed events', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Also fails on all of serde, new instance, ported assertions.
			 */
			it.fails('set[s the] value', async () => {
				const scenario = await Scenario.init('multiple-events.xml');

				const deserializedScenario = await scenario.serializeAndDeserializeForm();

				await deserializedScenario.newInstance();

				// assertThat(deserializedScenario.answerOf("/data/my-calculated-value").getDisplayText(), is("10"));
				expect(deserializedScenario.answerOf('/data/my-calculated-value').getValue()).toBe('10');

				deserializedScenario.answer('/data/my-value', '15');

				// assertThat(deserializedScenario.answerOf("/data/my-calculated-value").getDisplayText(), is("30"));
				expect(deserializedScenario.answerOf('/data/my-calculated-value').getValue()).toBe('30');
			});
		});

		describe('invalid event names', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - We have discussed, but not yet actually implemented, producing Result
			 *   types rather than throwing, throughout the engine/client interface.
			 *   We should consider a more general description of this test that
			 *   doesn't presuppose the mechanism of error propagation.
			 *
			 * - The ported test will, **for now**, be adapted to the equivalent
			 *   assertions for checking a thrown error (well, in our case a rejected
			 *   `Promise`). This shouldn't detract from the above point, it's just
			 *   the most reasonable way to preserve the current intent of the test as
			 *   ported from JavaRosa.
			 *
			 * - As with other ported tests checking for thrown errors/rejected
			 *   `Promise`s, the original assertion code is commented out and an
			 *   equivalent follows. The error message text is also checked, as it
			 *   seems likely this general category of error messaging would be good
			 *   to align on.
			 *
			 * - Test currently fails: beyond current lack of support for
			 *   actions/events generally, we also don't yet produce any errors and/or
			 *   warnings on unsupported features.
			 */
			it.fails('throw[s an] exception', async () => {
				// expectedException.expect(XFormParseException.class);
				// expectedException.expectMessage("An action was registered for unsupported events: odk-inftance-first-load, my-fake-event");

				const init = async () => {
					return Scenario.init('invalid-events.xml');
				};

				await expect(init).rejects.toThrowError(
					'An action was registered for unsupported events: odk-inftance-first-load, my-fake-event'
				);
			});
		});
	});

	/**
	 * **PORTING NOTES**
	 *
	 * - Again, in general assertions of `getDisplayText` are ported as `getValue`
	 *   (with the original assertion above/commented out) unless there's a clear
	 *   reason they'd be expected to have a semantic difference.
	 *
	 * - It isn't clear whether the {@link r} helper has any purpose. It's a weird
	 *   name, unclear in what its purpose _should be_ without following it back
	 *   to its origin[s]. Can we consider... getting rid of it/moving the
	 *   pertinent logic directly into an equivalent init function/static method?
	 *   (Also hopefully with a distinct name, in place of the current equivalent
	 *   signature overload?)
	 *
	 * - It seems helpful to include pertinent links to the spec, as the below
	 *   comment preserved from JavaRosa does. Can we do this throughout? Besides
	 *   being helpful _in general_, it could also help with organizational
	 *   ambiguities when tests are concerned with the intersection of multiple
	 *   aspects of the spec.
	 *
	 * - Speaking of which, all of these are of course concerned with repeats.
	 *   It's really kind of a toss up IMO whether it makes more sense to have a
	 *   general actions/events organization, or to organize action/event tests
	 *   alongside other features they intersect.
	 *
	 * - - -
	 *
	 * JR:
	 *
	 * Specification:
	 * https://getodk.github.io/xforms-spec/#the-odk-new-repeat-event.
	 */
	describe('OdkNewRepeatEventTest.java', () => {
		describe('[`setvalue`] set value on repeat insert[?] in body', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Fails as ported: 0-based index predicate
			 *
			 * - Still fails with 1-based position predicate correction: current lack
			 *   of support for actions/events
			 */
			describe.each<PredicateOptions>([
				{ oneBasedPositionPredicates: false },
				{ oneBasedPositionPredicates: true },
			])(
				'one-based position predicates: $oneBasedPositionPredicates',
				({ oneBasedPositionPredicates }) => {
					it.fails('sets [the] value in [the] repeat', async () => {
						const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));

						expect(scenario.countRepeatInstancesOf('/data/my-repeat')).toBe(0);

						scenario.createNewRepeat('/data/my-repeat');

						expect(scenario.countRepeatInstancesOf('/data/my-repeat')).toBe(1);

						// assertThat(scenario.answerOf("/data/my-repeat[0]/defaults-to-position").getDisplayText(), is("1"));
						if (oneBasedPositionPredicates) {
							expect(scenario.answerOf('/data/my-repeat[1]/defaults-to-position').getValue()).toBe(
								'1'
							);
						} else {
							expect(scenario.answerOf('/data/my-repeat[0]/defaults-to-position').getValue()).toBe(
								'1'
							);
						}
					});
				}
			);
		});

		describe('adding repeat [instance]', () => {
			it.fails('does not change [the] value set for [the] previous repeat [instance]', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));

				scenario.createNewRepeat('/data/my-repeat');

				// assertThat(scenario.answerOf("/data/my-repeat[1]/defaults-to-position").getDisplayText(), is("1"));
				expect(scenario.answerOf('/data/my-repeat[1]/defaults-to-position').getValue()).toBe('1');

				scenario.createNewRepeat('/data/my-repeat');

				// assertThat(scenario.answerOf("/data/my-repeat[2]/defaults-to-position").getDisplayText(), is("2"));
				expect(scenario.answerOf('/data/my-repeat[2]/defaults-to-position').getValue()).toBe('2');

				// assertThat(scenario.answerOf("/data/my-repeat[1]/defaults-to-position").getDisplayText(), is("1"));
				expect(scenario.answerOf('/data/my-repeat[1]/defaults-to-position').getValue()).toBe('1');
			});
		});

		describe('[`setvalue`] set value on repeat in body', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Fails as ported: 0-based index predicate
			 *
			 * - Still fails with 1-based position predicate correction: current lack
			 *   of support for actions/events
			 */
			describe.each<PredicateOptions>([
				{ oneBasedPositionPredicates: false },
				{ oneBasedPositionPredicates: true },
			])(
				'one-based position predicates: $oneBasedPositionPredicates',
				({ oneBasedPositionPredicates }) => {
					it.fails('uses [the] current context for relative references', async () => {
						const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));

						scenario.answer('/data/my-toplevel-value', '12');

						scenario.createNewRepeat('/data/my-repeat');

						// assertThat(scenario.answerOf("/data/my-repeat[0]/defaults-to-toplevel").getDisplayText(), is("14"));
						if (oneBasedPositionPredicates) {
							expect(scenario.answerOf('/data/my-repeat[1]/defaults-to-toplevel').getValue()).toBe(
								'14'
							);
						} else {
							expect(scenario.answerOf('/data/my-repeat[0]/defaults-to-toplevel').getValue()).toBe(
								'14'
							);
						}
					});
				}
			);
		});

		describe('[`setvalue`] set value on repeat with count', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Typical `getDisplayText` commentary
			 *
			 * - Fails on current lack of support for both actions/events and
			 *   `jr:count`
			 *
			 * - The `while` loops, ported directly, don't adapt well to our addition
			 *   of an asserted/expected node-set reference to the
			 *   {@link Scenario.next} signature. A best effort is made to preserve
			 *   the apparent intent, but it may be worth considering adopting a
			 *   `range`-based approach similar to many tests in `repeat.test.ts`. On
			 *   the other hand, it's not clear if there's any value in these
			 *   {@link Scenario.next} calls, which isn't redundant given the other
			 *   assertions?
			 */
			it.fails('sets [the] value for each repeat [instance]', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));

				scenario.answer('/data/repeat-count', 4);

				let expectedRepeatPosition = 0;
				while (!scenario.atTheEndOfForm()) {
					// WAS:
					//
					// scenario.next();

					expectedRepeatPosition += 1;

					scenario.next(`/data/my-jr-count-repeat[${expectedRepeatPosition}]`);
					scenario.next(
						`/data/my-jr-count-repeat[${expectedRepeatPosition}]/defaults-to-position-again`
					);
				}

				expect(scenario.countRepeatInstancesOf('/data/my-jr-count-repeat')).toBe(4);

				// assertThat(scenario.answerOf("/data/my-jr-count-repeat[1]/defaults-to-position-again").getDisplayText(), is("1"));
				expect(
					scenario.answerOf('/data/my-jr-count-repeat[1]/defaults-to-position-again').getValue()
				).toBe('1');

				// assertThat(scenario.answerOf("/data/my-jr-count-repeat[2]/defaults-to-position-again").getDisplayText(), is("2"));
				expect(
					scenario.answerOf('/data/my-jr-count-repeat[2]/defaults-to-position-again').getValue()
				).toBe('2');

				// assertThat(scenario.answerOf("/data/my-jr-count-repeat[3]/defaults-to-position-again").getDisplayText(), is("3"));
				expect(
					scenario.answerOf('/data/my-jr-count-repeat[3]/defaults-to-position-again').getValue()
				).toBe('3');

				// assertThat(scenario.answerOf("/data/my-jr-count-repeat[4]/defaults-to-position-again").getDisplayText(), is("4"));
				expect(
					scenario.answerOf('/data/my-jr-count-repeat[4]/defaults-to-position-again').getValue()
				).toBe('4');

				// Adding repeats should trigger odk-new-repeat for those new nodes
				scenario.answer('/data/repeat-count', 6);

				scenario.jumpToBeginningOfForm();

				expectedRepeatPosition = 0;

				while (!scenario.atTheEndOfForm()) {
					// WAS:
					//
					// scenario.next();

					if (expectedRepeatPosition === 0) {
						scenario.next('/data/my-toplevel-value');
						scenario.next('/data/repeat-count');
					}

					expectedRepeatPosition += 1;
					scenario.next(`/data/my-jr-count-repeat[${expectedRepeatPosition}]`);
				}

				expect(scenario.countRepeatInstancesOf('/data/my-jr-count-repeat')).toBe(6);

				// assertThat(scenario.answerOf("/data/my-jr-count-repeat[6]/defaults-to-position-again").getDisplayText(), is("6"));
				expect(
					scenario.answerOf('/data/my-jr-count-repeat[6]/defaults-to-position-again').getValue()
				).toBe('6');
			});
		});

		/**
		 * **PORTING NOTES**
		 *
		 * 1. None of this test feels like it has anything to do with
		 *    actions/events, `odk-new-repeat` specifically, or really anything in
		 *    this module/suite/bag/vat other than loading the same fixture.
		 *    Options...
		 *
		 * - Move to `repeat.test.js`? Presumably organized with other tests
		 *   exercising `jr:count`? But the actual **point of the test** seems to
		 *   have little to do with `jr:count` except as a side effect (or as a
		 *   regression test?). It's really more concerned with casting, so...
		 *
		 * - Move to somewhere concerned with casting? As yet undiscovered, may or
		 *   may not already exist, though there are a bunch of notes already about
		 *   casting concerns, as well as at least one newish issue referencing
		 *   those concerns.
		 *
		 * 2. How much of this is even an engine test, versus a {@link Scenario} API
		 *    test? (And is the answer to that the same in web forms as it is for
		 *    the same test in JavaRosa?)
		 *
		 * 3. Rephrase?
		 *
		 * 4. JavaRosa's test exercises each of integer-as-string, decimal (float?),
		 *    and long. The closest we'll get is integer-as-string, float, bigint.
		 *    But it's also worth calling out that we generally don't distinguish
		 *    between integer/fractional-number types (or number types at all except
		 *    as a precaution), so the semantics of this test wouldn't quite line up
		 *    no matter how we slice it.
		 *
		 * 5. No further attempt is made to handle the `while`/`next` pattern. It
		 *    doesn't seem pertinent. Those are commented out in case we want to
		 *    revisit this assumption.
		 *
		 * 6. Unsurprisingly fails on current lack of support for `jr:count`. But a
		 *    few alternate tests follow only asserting the cast of the value, since
		 *    that's the apparent focus of the test. Even though most should pass
		 *    (the fractional value likely won't yet), they will currently only
		 *    exercise the casting logic here in the `scenario` client's
		 *    {@link Scenario.answer} implementation.
		 */
		describe('set [value other than integer] other than integer value, on repeat with count', () => {
			it.fails('converts [the count-setting]', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));

				// String
				scenario.answer('/data/repeat-count', '1');

				// while (!scenario.atTheEndOfForm()) {
				//     scenario.next();
				// }

				expect(scenario.countRepeatInstancesOf('/data/my-jr-count-repeat')).toBe(0);

				// Decimal
				scenario.jumpToBeginningOfForm();
				scenario.answer('/data/repeat-count', 2.5);
				// while (!scenario.atTheEndOfForm()) {
				//     scenario.next();
				// }

				expect(scenario.countRepeatInstancesOf('/data/my-jr-count-repeat')).toBe(2);

				// JR: Long
				// Web forms: bigint
				scenario.jumpToBeginningOfForm();
				scenario.answer('/data/repeat-count', BigInt(3));

				// while (!scenario.atTheEndOfForm()) {
				//     scenario.next();
				// }

				expect(scenario.countRepeatInstancesOf('/data/my-jr-count-repeat')).toBe(3);
			});

			it("(alternate) casts an integer-as-string value to an integer [which controls a repeat's `jr:count`]", async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));

				scenario.answer('/data/repeat-count', '1');

				expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(1));
			});

			/**
			 * **PORTING NOTES** (alternate)
			 *
			 * As expected, this fails. It could be made to pass by updating the
			 * pertinent {@link Scenario.answer} casting logic, but that just feels
			 * like cheating.
			 */
			it.fails(
				"(alternate) casts a decimal/fractional value to an integer [which controls a repeat's `jr:count`]",
				async () => {
					const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));

					scenario.answer('/data/repeat-count', 2.5);

					expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(2));
				}
			);

			it("(alternate) assigns a non-fractional integer-as-float-number [which controls a repeat's `jr:count`]", async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));

				scenario.answer('/data/repeat-count', 2);

				expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(2));
			});

			it("(alternate) casts and/or assigns bigint [which controls a repeat's `jr:count`]", async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));

				scenario.answer('/data/repeat-count', 3n);

				expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(3));
			});
		});

		describe('repeat in form def instance', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Typical `nullValue()` -> blank/empty string check.
			 *
			 * - First assertions pass as expected, but now we can use the test to
			 *   help us keep it that way when we implement this feature to make the
			 *   last one pass.
			 */
			it.fails('never fires [an odk-new-repeat] new repeat event', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));

				// assertThat(scenario.answerOf("/data/my-repeat-without-template[1]/my-value"), is(nullValue()));
				expect(scenario.answerOf('/data/my-repeat-without-template[1]/my-value').getValue()).toBe(
					''
				);

				// assertThat(scenario.answerOf("/data/my-repeat-without-template[2]/my-value"), is(nullValue()));
				expect(scenario.answerOf('/data/my-repeat-without-template[2]/my-value').getValue()).toBe(
					''
				);

				scenario.createNewRepeat('/data/my-repeat-without-template');

				// assertThat(scenario.answerOf("/data/my-repeat-without-template[3]/my-value").getDisplayText(), is("2"));
				expect(scenario.answerOf('/data/my-repeat-without-template[3]/my-value').getValue()).toBe(
					'2'
				);
			});
		});

		describe('new repeat instance', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Test description suggests assertion of something not being affected,
			 * but the actual assertions are about different action/event outcomes.
			 * Both seem like valid things to test (separately), but the current
			 * description and test body conflate the two.
			 */
			it.fails(
				'does not trigger [the] action[/event] on [an] unrelated repeat [instance]',
				async () => {
					const scenario = await Scenario.init(
						'Parallel repeats',
						html(
							head(
								title('Parallel repeats'),
								model(
									mainInstance(
										t(
											'data id="parallel-repeats"',
											t('repeat1', t('q1')),

											t('repeat2', t('q1'))
										)
									)
								)
							),
							body(
								repeat(
									'/data/repeat1',
									setvalue('odk-new-repeat', '/data/repeat1/q1', "concat('foo','bar')"),
									input('/data/repeat1/q1')
								),
								repeat(
									'/data/repeat2',
									setvalue('odk-new-repeat', '/data/repeat2/q1', "concat('bar','baz')"),
									input('/data/repeat2/q1')
								)
							)
						)
					);

					scenario.createNewRepeat('/data/repeat1');
					scenario.createNewRepeat('/data/repeat1');

					scenario.createNewRepeat('/data/repeat2');
					scenario.createNewRepeat('/data/repeat2');

					// assertThat(scenario.answerOf("/data/repeat1[2]/q1").getDisplayText(), is("foobar"));
					expect(scenario.answerOf('/data/repeat1[2]/q1').getValue()).toBe('foobar');

					// assertThat(scenario.answerOf("/data/repeat1[3]/q1").getDisplayText(), is("foobar"));
					expect(scenario.answerOf('/data/repeat1[3]/q1').getValue()).toBe('foobar');

					// assertThat(scenario.answerOf("/data/repeat2[2]/q1").getDisplayText(), is("barbaz"));
					expect(scenario.answerOf('/data/repeat2[2]/q1').getValue()).toBe('barbaz');

					// assertThat(scenario.answerOf("/data/repeat2[3]/q1").getDisplayText(), is("barbaz"));
					expect(scenario.answerOf('/data/repeat2[3]/q1').getValue()).toBe('barbaz');
				}
			);

			/**
			 * **PORTING NOTES**
			 *
			 * This test fails, which was already expected due to current lack of
			 * support for actions/events. But it's unclear how it passes in JavaRosa!
			 * The test was only partially updated to use 1-based positional
			 * predicates. It seems like **at least** the first assertion should fail
			 * there too.
			 */
			describe.each<PredicateOptions>([
				{ oneBasedPositionPredicates: false },
				{ oneBasedPositionPredicates: true },
			])(
				'one-based position predicates: $one-based-position-predicates',
				({ oneBasedPositionPredicates }) => {
					it.fails('can use [the] previous instance as [a] default', async () => {
						const scenario = await Scenario.init(
							'Default from prior instance',
							html(
								head(
									title('Default from prior instance'),
									model(
										mainInstance(t('data id="default-from-prior-instance"', t('repeat', t('q')))),
										bind('/data/repeat/q').type('integer')
									)
								),
								body(
									repeat(
										'/data/repeat',
										setvalue(
											'odk-new-repeat',
											'/data/repeat/q',
											'/data/repeat[position()=position(current()/..)-1]/q'
										),
										input('/data/repeat/q')
									)
								)
							)
						);

						scenario.next('/data/repeat[1]');
						scenario.next('/data/repeat[1]/q');
						scenario.answer(7);

						if (oneBasedPositionPredicates) {
							expect(scenario.answerOf('/data/repeat[1]/q')).toEqualAnswer(intAnswer(7));
						} else {
							expect(scenario.answerOf('/data/repeat[0]/q')).toEqualAnswer(intAnswer(7));
						}

						scenario.next('/data/repeat');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/repeat',
						});

						scenario.next('/data/repeat[2]/q');

						if (oneBasedPositionPredicates) {
							expect(scenario.answerOf('/data/repeat[2]/q')).toEqualAnswer(intAnswer(7));
						} else {
							expect(scenario.answerOf('/data/repeat[1]/q')).toEqualAnswer(intAnswer(7));
						}

						scenario.answer(8); // override the default

						scenario.next('/data/repeat');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/repeat',
						});

						/**
						 * **PORTING NOTES**
						 *
						 * Does this... do anything??
						 */
						scenario.next('/data/repeat[3]/q');

						/**
						 * **PORTING NOTES**
						 *
						 * These were already updated (hence lack of branch on their references)
						 */
						expect(scenario.answerOf('/data/repeat[1]/q')).toEqualAnswer(intAnswer(7));
						expect(scenario.answerOf('/data/repeat[2]/q')).toEqualAnswer(intAnswer(8));
						expect(scenario.answerOf('/data/repeat[3]/q')).toEqualAnswer(intAnswer(8));
					});
				}
			);
		});

		describe('[`setvalue`] set value on repeat insert[?] in model', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - New-to-me expected failure pattern (as decorator), commented to preserve/show intent
			 *
			 * - Adapted to our own alternate approach to this, because it otherwise hangs indefinitely as some other checks for error conditions
			 */
			// JR:
			// @Test(expected = XFormParseException.class)
			it.fails('[is] not allowed', async () => {
				// JR (equivalent):
				// await Scenario.init(r("event-odk-new-repeat-model.xml"));

				let caught: unknown = null;

				try {
					await Scenario.init(r('event-odk-new-repeat-model.xml'));
				} catch (error) {
					caught = error;
				}

				expect(caught).toBeInstanceOf(Error);
			});
		});
	});

	describe('RecordAudioActionTest.java', () => {
		describe('[`odk:recordaudio`] record audio action', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - This action is not included in the
			 *   {@link https://getodk.github.io/xforms-spec/#events | ODK XForms Specification - Events}
			 *   section. It clearly has applicability in JavaRosa, and so presumably
			 *   in Collect. Should we support it? If so, we should presumably also
			 *   update the spec.
			 *
			 * - The call to {@link JRFormDef.hasAction} is stubbed to throw. If we do
			 *   want assertions about whether a particular action is handled by a
			 *   particular form, we should carefully consider how we intend to expose
			 *   that in the engine/client interface.
			 *
			 * - My instinct is that actions should be **mostly an implementation
			 *   detail** from a client perspective (as `calculate` is currently as
			 *   well), at least as far as _most_ user-facing client concerns go. In
			 *   general, exceptions where one might expect to observe such aspects of
			 *   form definition would tend to be in non-form-filling use cases (and
			 *   testing [of implementation] may be one of those, but I think they're
			 *   more likely to be cases like **form testing**). The other likely use
			 *   case would be warning on the inverse of this test's assertion (i.e.
			 *   alerting a user that a form definition expects certain functionality
			 *   which we don't [yet] support).
			 */
			it.fails('is processed on form parse', async () => {
				const scenario = await Scenario.init(
					'Record audio form',
					html(
						head(
							title('Record audio form'),
							model(
								mainInstance(t('data id="record-audio-form"', t('recording'), t('q1'))),
								t('odk:recordaudio event="odk-instance-load" ref="/data/recording"')
							)
						),
						body(input('/data/q1'))
					)
				);

				expect(scenario.getFormDef().hasAction('recordaudio')).toBe(true);
			});

			/**
			 * **PORTING NOTES**
			 *
			 * - Rephrase? This appears to be intended to reference a method name on
			 *   `CapturingRecordAudioActionListener`, which does not have a matching
			 *   method name which could be called. The likely equivalent method is
			 *   `recordAudioTriggered`. In any case, that seems like an
			 *   implementation detail we wouldn't want to capture in the test's
			 *   description.
			 *
			 * - The `CapturingRecordAudioActionListener` and `RecordAudioActions`
			 *   classes are stubbed to throw on calls invoked _within the test body_.
			 *   The test would fail regardless, due to lack of support for
			 *   actions/events (and `odk:recordaudio` in particular, whose inclusion
			 *   in scope is unclear). But the test also appears to exercise some sort
			 *   of "spooky action at a distance" that I don't think we should
			 *   remotely try to replicate: the existence of a listener instance, and
			 *   assignment of it to an apparent `RecordAudioActions` singleton's
			 *   listeners, in the test body seems to imply that these will have some
			 *   interaction with the form initialized in the {@link Scenario.init}
			 *   call... despite neither being passed to `Scenario` or otherwise
			 *   associated with it or its form state.
			 *
			 * - If it's not already obvious from the above notes, this test is
			 *   expected to fail. (I believe it's even the first test I've ported and
			 *   immediately marked failing before running it to confirm.)
			 *
			 * - Insofar as the assertion on `getRef` may ever become pertinent, note
			 *   that the `toEqual` assertion would likely fail without some
			 *   additional consideration. Ideally, though, we'd port details like
			 *   that another way if they become pertinent at all.
			 */
			it.fails('callsListenerActionTriggeredWhenTriggered[?]', async () => {
				const listener = new CapturingRecordAudioActionListener();

				RecordAudioActions.setRecordAudioListener(listener);

				await Scenario.init(
					'Record audio form',
					html(
						head(
							title('Record audio form'),
							model(
								mainInstance(t('data id="record-audio-form"', t('recording'), t('q1'))),
								t(
									'odk:recordaudio event="odk-instance-load" ref="/data/recording" odk:quality="foo"'
								)
							)
						),
						body(input('/data/q1'))
					)
				);

				expect(listener.getAbsoluteTargetRef()).toEqual(getRef('/data/recording'));
				expect(listener.getQuality()).toBe('foo');
			});
		});
	});
});
