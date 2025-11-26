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
	setvalue,
	setvalueLiteral,
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

// TODO split test file up

/**
 *
 * [This has been updated to reflect current/recent reality, including some
 * recent revisions to test logic throughout the suite. See git blame for
 * PORTING NOTES written here previously, if they'd have any future value.]
 *
 * **PORTING NOTES**
 *
 * Most of these tests still fail pending implementation of actions and events.
 * Some tests were made to pass because they exercise other functionality (and
 * the previous top-level comment lagged that fact in confusing ways).
 *
 * At time of writing, the following changes and observations are now
 * applicable, either throughout the suite or where specified:
 *
 * - All calls to {@link Scenario.newInstance} have been updated to reference
 *   the new instance **of {@link Scenario}** now returned by that method (more
 *   detail on the method's JSDoc). This may be a bit noisy if we need to
 *   reconcile unrelated updates from JavaRosa, but I believe it's worth the
 *   friction to avoid the **much much greater friction** of making that method
 *   stateful on a single {@link Scenario} class instance. (I spent about five
 *   minutes thinking about how that would be achieved. While I'm sure it's
 *   doable, I believe it'd be an incredibly poor use of time.)
 *
 * - A couple of calls to {@link Scenario.serializeAndDeserializeForm} have been
 *   changed to call {@link Scenario.proposed_serializeAndRestoreInstanceState},
 *   a proposed {@link Scenario} API addition described in more detail there. It
 *   is my understanding from discussion with @lognaturel that this is closer to
 *   the intended semantics for these calls.
 *
 * - Note that those affected tests are still failing, pending actions/events
 *   functionality! The above changes are all speculative. They're also
 *   intentionally limited. I took a light touch rewriting those calls.
 *   Specifically, I only updated tests which **clearly** excercise:
 *
 *     1. Load a form/instance
 *     2. Directly write to instance state
 *     3. Serialize and restore "form" state
 *     4. Assert something about restored instance state which could not pass by
 *        serializing form state alone; such assertions would only pass with
 *        serde of instance state, including the write peformed in (2).
 *
 * - There are several other calls to
 *   {@link Scenario.serializeAndDeserializeForm} which are very likely intended
 *   to use the same {@link Scenario.proposed_serializeAndRestoreInstanceState}
 *   semantics. A common pattern for these is:
 *
 *     1. Load a form/instance
 *     2. Assert that some load-specific action/event was performed
 *     3. Serialize and restore instance state
 *     4. Assert that the same load-specific action/event either **was** or
 *        **was not** performed, based on its specified nth-load semantics.
 *
 *     These other tests can be updated when we've implemented the functionality
 *     under test, at which point we can validate these presumed updates with
 *     more than an educated hunch.
 */
describe('Actions/Events', () => {
	describe('InstanceLoadEventsTest.java', () => {
		describe('odk-instance-load event', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/InstanceLoadEventsTest.java#L28
			it('fires event on first load', async () => {
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

			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/InstanceLoadEventsTest.java#L48
			it('fires on second load', async () => {
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
				const restored = await scenario.proposed_serializeAndRestoreInstanceState();
				expect(restored.answerOf('/data/q1')).toEqualAnswer(intAnswer(16));
			});

			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/InstanceLoadEventsTest.java#L96
			it('triggers nested actions', async () => {
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

			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/InstanceLoadEventsTest.java#L121
			it('is triggered for all pre-existing repeat instances', async () => {
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

		describe('odk-instance-first-load event', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/InstanceLoadEventsTest.java#L72
			it('does not fire when restoring', async () => {
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
				const restored = await scenario.proposed_serializeAndRestoreInstanceState();
				expect(restored.answerOf('/data/q1')).toEqualAnswer(intAnswer(555));
			});

			it('does not fire when editing', async () => {
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
				const restored = await scenario.proposed_editCurrentInstanceState();
				expect(restored.answerOf('/data/q1')).toEqualAnswer(intAnswer(555));
			});
		});
	});

	describe('MultipleEventsTest.java', () => {
		describe('nested first load event', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L21
			it('sets the value when nested', async () => {
				const scenario = await Scenario.init('multiple-events.xml');
				expect(scenario.answerOf('/data/nested-first-load').getValue()).toBe('cheese');
			});

			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L28
			it('sets the value when nested in group', async () => {
				const scenario = await Scenario.init('multiple-events.xml');
				expect(scenario.answerOf('/data/my-group/nested-first-load-in-group').getValue()).toBe(
					'more cheese'
				);
			});
		});

		describe('serialized and deserialized nested odk-instance-first-load first load event', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L35
			it('sets the value when nested', async () => {
				const scenario = await Scenario.init('multiple-events.xml');
				const deserializedScenario = await scenario.proposed_serializeAndRestoreInstanceState();
				const newInstance = deserializedScenario.newInstance();
				expect(newInstance.answerOf('/data/nested-first-load').getValue()).toBe('cheese');
			});

			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L44
			it('sets the value when nested in group', async () => {
				const scenario = await Scenario.init('multiple-events.xml');
				const deserializedScenario = await scenario.proposed_serializeAndRestoreInstanceState();
				const newInstance = deserializedScenario.newInstance();
				expect(newInstance.answerOf('/data/my-group/nested-first-load-in-group').getValue()).toBe(
					'more cheese'
				);
			});
		});

		describe('nested odk-instance-first-load and xforms-value-changed events', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L53
			it('sets the value', async () => {
				const scenario = await Scenario.init('multiple-events.xml');
				expect(scenario.answerOf('/data/my-calculated-value').getValue()).toBe('10');
				scenario.answer('/data/my-value', '15');
				expect(scenario.answerOf('/data/my-calculated-value').getValue()).toBe('30');
			});
		});

		describe('serialized and deserialized nested odk-instance-first-load and xforms-value-changed events', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L62
			it('sets the value', async () => {
				const scenario = await Scenario.init('multiple-events.xml');
				const deserializedScenario = await scenario.proposed_serializeAndRestoreInstanceState();
				const newInstance = deserializedScenario.newInstance();
				expect(newInstance.answerOf('/data/my-calculated-value').getValue()).toBe('10');
				newInstance.answer('/data/my-value', '15');
				expect(newInstance.answerOf('/data/my-calculated-value').getValue()).toBe('30');
			});
		});

		describe('invalid event names', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/MultipleEventsTest.java#L73
			it('throws an exception', async () => {
				const init = async () => {
					await Scenario.init('invalid-events.xml');
				};
				await expect(init).rejects.toThrowError(
					'An action was registered for unsupported events: odk-inftance-first-load, my-fake-event'
				);
			});
		});
	});

	describe('OdkNewRepeatEventTest.java', () => {
		describe('setvalue on add repeat ', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L32
			it('sets the value in the repeat', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
				expect(scenario.countRepeatInstancesOf('/data/my-repeat')).toBe(0);
				scenario.createNewRepeat('/data/my-repeat');
				expect(scenario.countRepeatInstancesOf('/data/my-repeat')).toBe(1);
				expect(scenario.answerOf('/data/my-repeat[1]/defaults-to-position').getValue()).toBe('1');
			});
		});

		describe('adding repeat instance', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L42
			it('does not change the value set for the previous repeat instance', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
				scenario.createNewRepeat('/data/my-repeat');
				expect(scenario.answerOf('/data/my-repeat[1]/defaults-to-position').getValue()).toBe('1');
				scenario.createNewRepeat('/data/my-repeat');
				expect(scenario.answerOf('/data/my-repeat[2]/defaults-to-position').getValue()).toBe('2');
				expect(scenario.answerOf('/data/my-repeat[1]/defaults-to-position').getValue()).toBe('1');
			});
		});

		describe('setvalue on repeat in body', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L55
			it('uses the current context for relative references', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
				scenario.answer('/data/my-toplevel-value', '12');
				scenario.createNewRepeat('/data/my-repeat');
				expect(scenario.answerOf('/data/my-repeat[1]/defaults-to-toplevel').getValue()).toBe('14');
			});
		});

		describe('setvalue on repeat with count', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L65
			it('sets the value for each repeat instance', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));

				const REPEAT_COUNT = 4;
				scenario.answer('/data/repeat-count', REPEAT_COUNT);

				for (let i = 1; i < REPEAT_COUNT; i++) {
					scenario.next(`/data/my-jr-count-repeat[${i}]`);
					scenario.next(`/data/my-jr-count-repeat[${i}]/defaults-to-position-again`);
					expect(
						scenario
							.answerOf(`/data/my-jr-count-repeat[${i}]/defaults-to-position-again`)
							.getValue()
					).toBe(`${i}`);
				}

				expect(scenario.countRepeatInstancesOf('/data/my-jr-count-repeat')).toBe(REPEAT_COUNT);

				// Adding repeats should trigger odk-new-repeat for those new nodes
				const NEW_REPEAT_COUNT = 6;
				scenario.answer('/data/repeat-count', NEW_REPEAT_COUNT);

				scenario.jumpToBeginningOfForm();

				scenario.next('/data/my-toplevel-value');
				scenario.next('/data/my-repeat');
				scenario.next('/data/repeat-count');
				for (let i = 1; i < NEW_REPEAT_COUNT; i++) {
					scenario.next(`/data/my-jr-count-repeat[${i}]`);
					scenario.next(`/data/my-jr-count-repeat[${i}]/defaults-to-position-again`);
				}

				expect(scenario.countRepeatInstancesOf('/data/my-jr-count-repeat')).toBe(6);

				expect(
					scenario.answerOf('/data/my-jr-count-repeat[6]/defaults-to-position-again').getValue()
				).toBe('6');
			});
		});

		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L94
		describe('setvalue other than integer value, on repeat with count', () => {
			it('casts an integer-as-string value to an integer', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
				scenario.answer('/data/repeat-count', '1');
				expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(1));
			});

			it('casts a decimal/fractional value to an integer', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
				scenario.answer('/data/repeat-count', 2.5);
				expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(2));
			});

			it('assigns a non-fractional integer-as-float-number', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
				scenario.answer('/data/repeat-count', 2);
				expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(2));
			});

			it('casts and/or assigns bigint', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
				scenario.answer('/data/repeat-count', 3n);
				expect(scenario.answerOf('/data/repeat-count')).toEqualAnswer(intAnswer(3));
			});
		});

		describe('repeat in form def instance', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L122
			it('never fires an odk-new-repeat new repeat event', async () => {
				const scenario = await Scenario.init(r('event-odk-new-repeat.xml'));
				expect(scenario.answerOf('/data/my-repeat-without-template[1]/my-value').getValue()).toBe(
					''
				);
				expect(scenario.answerOf('/data/my-repeat-without-template[2]/my-value').getValue()).toBe(
					''
				);
				scenario.createNewRepeat('/data/my-repeat-without-template');
				expect(scenario.answerOf('/data/my-repeat-without-template[3]/my-value').getValue()).toBe(
					'2'
				);
			});
		});

		describe('new repeat instance', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L133
			it('does not trigger the action on an unrelated repeat instance', async () => {
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

				expect(scenario.answerOf('/data/repeat1[2]/q1').getValue()).toBe('foobar');
				expect(scenario.answerOf('/data/repeat1[3]/q1').getValue()).toBe('foobar');
				expect(scenario.answerOf('/data/repeat2[2]/q1').getValue()).toBe('barbaz');
				expect(scenario.answerOf('/data/repeat2[3]/q1').getValue()).toBe('barbaz');
			});

			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L172
			it('can use the previous instance as the default', async () => {
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

				expect(scenario.answerOf('/data/repeat[1]/q')).toEqualAnswer(intAnswer(7));

				scenario.next('/data/repeat');
				scenario.createNewRepeat({
					assertCurrentReference: '/data/repeat',
				});

				scenario.next('/data/repeat[2]/q');

				expect(scenario.answerOf('/data/repeat[2]/q')).toEqualAnswer(intAnswer(7));

				scenario.answer(8); // override the default

				scenario.next('/data/repeat');
				scenario.createNewRepeat({
					assertCurrentReference: '/data/repeat',
				});

				scenario.next('/data/repeat[3]/q');

				expect(scenario.answerOf('/data/repeat[1]/q')).toEqualAnswer(intAnswer(7));
				expect(scenario.answerOf('/data/repeat[2]/q')).toEqualAnswer(intAnswer(8));
				expect(scenario.answerOf('/data/repeat[3]/q')).toEqualAnswer(intAnswer(8));
			});
		});

		describe('setvalue on repeat insert in model', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/OdkNewRepeatEventTest.java#L209
			it('throws an error', async () => {
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

		describe('target reference in repeat', () => {
			it.fails('is contextualized', async () => {
				const listener = new CapturingRecordAudioActionListener();
				RecordAudioActions.setRecordAudioListener(listener);

				await Scenario.init(
					'Record audio form',
					html(
						head(
							title('Record audio form'),
							model(
								mainInstance(t('data id="record-audio-form"', t('repeat', t('recording'), t('q1'))))
							)
						),
						body(
							repeat(
								'/data/repeat',
								t('odk:recordaudio event="odk-instance-load" ref="/data/repeat/recording"'),
								input('/data/repeat/q1')
							)
						)
					)
				);

				expect(listener.getAbsoluteTargetRef()).toEqual(getRef('/data/repeat[1]/recording'));
			});
		});

		describe('serialization and deserialization', () => {
			it.fails('maintains fields', async () => {
				const scenario = await Scenario.init(
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

				const listener = new CapturingRecordAudioActionListener();
				RecordAudioActions.setRecordAudioListener(listener);

				await scenario.proposed_serializeAndRestoreInstanceState();

				expect(listener.getAbsoluteTargetRef()).toEqual(getRef('/data/recording'));
				expect(listener.getQuality()).toBe('foo');
			});
		});
	});

	/**
	 * **PORTING NOTES**
	 *
	 * The below {@link EXPECTED_STUB_ANSWER} was a bit of a mystery, in terms of
	 * understanding the current tests as ported from JavaRosa. As much as
	 * possible, the tests' logic is kept intact. But as I briefly thought about
	 * what we might want to change, such as providing a more direct mechanism to
	 * influence the resolution of geolocation data for testing purposes (hint:
	 * it'll probably be configurable in a very similar same way to the
	 * `fetchFormDefinition` engine config option), I also thought it worth
	 * mentioning these thoughts in anticipation of working on the feature:
	 *
	 * - Any web-native solution will almost certainly be async.
	 *
	 * - Whether or not we can effectively hide that asynchrony will largely
	 *   depend on:
	 *
	 *     - Whether it's during form init, which is already async, so we can do
	 *       an `odk-instance-first-load` lookup without changing anything about
	 *       the current interface guarantees; and then...
	 *     - After form init, how much we're willing to tolerate stale values,
	 *       e.g. either referencing state which _was captured on form init_, or
	 *       by periodic polling, or perhaps using some sort of client interaction
	 *       hints to optimistically initiate lookup immediately before it would
	 *       be needed (although that would either have to fall back to stale
	 *       values, or alter some other aspect of the interface guarantee for
	 *       sequencing purposes).
	 */
	describe('SetGeopointActionTest.java', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * None of these tests are expected to pass yet anyway... we don't support
		 * any actions/events, so we don't support `odk:setgeopoint`. But... what
		 * magic causes JavaRosa to produce this value, such that the corresponding
		 * tests pass there?! I don't see it.
		 *
		 * [...]
		 *
		 * Okay, I looked again and now I see it: the same value is produced by a
		 * `StubSetGeopointActionHandler`, which is implicitly expected to be the
		 * default handler, as registered
		 * {@link https://github.com/getodk/javarosa/blob/3f579c43f81049475e032948ba16f388e19620fd/src/main/java/org/javarosa/xform/parse/XFormParser.java#L336-L338 | here}.
		 */
		const EXPECTED_STUB_ANSWER = stringAnswer('no client implementation');

		describe('when namespace is not `odk`', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Rephrase?
			 *
			 * - Error expectation ported in same manner as previous test with similar
			 *   decorator annotation
			 *
			 * - Fails similarly on lack of any current logic to check for
			 *   actions/events at all, much less to reject on them being
			 *   known-but-malformed.
			 *
			 * - This seems like an odd case. Of course, the namespace check is
			 *   totally valid, but should it actually error...? Maybe. That's surely
			 *   more helpful than ignoring it (which we'd presumably do for forms
			 *   with _unrecognized actions_, since there's nothing in particular that
			 *   designates a tag as an action other than it being recognized). But
			 *   it's worth considering incorporating this into a broader story around
			 *   form analysis, perhaps producing a warning, and perhaps providing a
			 *   more graceful recovery option.
			 */
			// JR: @Test(expected = XFormParseException.class)
			it.fails('[produces an error] exception is thrown', async () => {
				let caught: unknown = null;

				try {
					await Scenario.init(r('setgeopoint-action-bad-namespace.xml'));
				} catch (error) {
					caught = error;
				}

				expect(caught).toBeInstanceOf(Error);
			});
		});

		describe('when instance is loaded', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Rephrase?
			 *
			 * - Fails: no support for this (or any) action/event
			 */
			it.fails('[sets the location?] location is set at target', async () => {
				const scenario = await Scenario.init(r('setgeopoint-action-instance-load.xml'));

				expect(scenario.answerOf('/data/location')).toEqualAnswer(EXPECTED_STUB_ANSWER);
			});
		});

		describe('when trigger node is updated', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Rephrase?
			 *
			 * - A strange new assertion syntax appears. Anyway, it's an answer/null check, and the comment suggests it's a safe assumption that it can follow the typical conversion from `nullValue()` -> blank/empty string check.
			 *
			 * - Fails pending feature support
			 */
			it.fails('[sets the location?] location is set at target', async () => {
				const scenario = await Scenario.init(r('setgeopoint-action-value-changed.xml'));

				// The test form has no default value at /data/location, and
				// no other event sets any value on it
				// assert scenario.answerOf("/data/location") == null;
				expect(scenario.answerOf('/data/location').getValue()).toBe('');

				// Answering a question triggers its "xforms-value-changed" event
				scenario.answer('/data/text', 'some answer');

				expect(scenario.answerOf('/data/location')).toEqualAnswer(EXPECTED_STUB_ANSWER);
			});
		});

		describe('[~~]test[~~?] serialization and deserialization', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * This seems to be entirely implementation detail. Skipped for now.
			 */
			it.skip('[has no clear BDD-ish description equivalent]', async () => {
				// StubSetGeopointAction originalAction = new StubSetGeopointAction(getRef("/data/text"));
				// Path ser = Files.createTempFile("serialized-object", null);
				// try (DataOutputStream dos = new DataOutputStream(Files.newOutputStream(ser))) {
				//     originalAction.writeExternal(dos);
				// }
				// SetGeopointAction deserializedAction = new StubSetGeopointAction(null);
				// try (DataInputStream dis = new DataInputStream(Files.newInputStream(ser))) {
				//     deserializedAction.readExternal(dis, defaultPrototypes());
				// }
				// // SetGeopointAction only serializes the targetReference (and name, from its superclass) members
				// assertThat(deserializedAction.getName(), is(originalAction.getName()));
				// assertThat(deserializedAction.getTargetReference(), equalTo(originalAction.getTargetReference()));
				// Files.delete(ser);
			});
		});
	});

	describe('SetValueActionTest.java', () => {
		describe('when trigger node is updated', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L51
			it('target node calculation is evaluated', async () => {
				const scenario = await Scenario.init(
					'Nested setvalue action',
					html(
						head(
							title('Nested setvalue action'),
							model(
								mainInstance(t('data id="nested-setvalue"', t('source'), t('destination'))),
								bind('/data/source').type('int'),
								bind('/data/destination').type('int')
							)
						),
						body(
							input('/data/source', setvalue('xforms-value-changed', '/data/destination', '4*4'))
						)
					)
				);

				expect(scenario.answerOf('/data/destination').getValue()).toBe('');
				scenario.next('/data/source');
				scenario.answer(22);
				expect(scenario.answerOf('/data/destination')).toEqualAnswer(intAnswer(16));
			});

			describe('with the same value', () => {
				// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L105
				it("does not evaluate the target node's `calculate`", async () => {
					const scenario = await Scenario.init(
						'Nested setvalue action',
						html(
							head(
								title('Nested setvalue action'),
								model(
									mainInstance(
										t('data id="nested-setvalue"', t('source'), t('destination'), t('some-field'))
									),
									bind('/data/destination').type('string')
								)
							),
							body(
								input(
									'/data/source',
									setvalue(
										'xforms-value-changed',
										'/data/destination',
										"concat('foo',/data/some-field)"
									)
								),
								input('/data/some-field')
							)
						)
					);

					expect(scenario.answerOf('/data/destination').getValue()).toBe('');

					scenario.next('/data/source');
					scenario.answer(22);

					expect(scenario.answerOf('/data/destination')).toEqualAnswer(stringAnswer('foo'));

					scenario.next('/data/some-field');
					scenario.answer('bar');

					scenario.prev('/data/source');
					scenario.answer(22);

					expect(scenario.answerOf('/data/destination')).toEqualAnswer(stringAnswer('foo'));

					scenario.answer(23);

					expect(scenario.answerOf('/data/destination')).toEqualAnswer(stringAnswer('foobar'));
				});
			});
		});

		describe('`setvalue`', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L141
			it('is serialized and deserialized', async () => {
				const scenario = await Scenario.init(
					'Nested setvalue action',
					html(
						head(
							title('Nested setvalue action'),
							model(
								mainInstance(t('data id="nested-setvalue"', t('source'), t('destination'))),
								bind('/data/destination').type('int')
							)
						),
						body(
							input('/data/source', setvalue('xforms-value-changed', '/data/destination', '4*4'))
						)
					)
				);

				await scenario.proposed_serializeAndRestoreInstanceState();

				expect(scenario.answerOf('/data/destination').getValue()).toBe('');

				scenario.next('/data/source');
				scenario.answer(22);

				expect(scenario.answerOf('/data/destination')).toEqualAnswer(intAnswer(16));
			});
		});

		describe('region groups', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L198
			it('`setvalue` in group sets value outside of group', async () => {
				const scenario = await Scenario.init(
					'Setvalue',
					html(
						head(
							title('Setvalue'),
							model(
								mainInstance(t('data id="setvalue"', t('g', t('source')), t('destination'))),
								bind('/data/g/source').type('string'),
								bind('/data/destination').type('int')
							)
						),
						body(
							group(
								'/data/g',
								input(
									'/data/g/source',
									setvalueLiteral('xforms-value-changed', '/data/destination', '7')
								)
							)
						)
					)
				);

				scenario.answer('/data/g/source', 'foo');

				expect(scenario.answerOf('/data/destination')).toEqualAnswer(intAnswer(7));
			});

			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L224
			it('`setvalue` outside group sets value in group', async () => {
				const scenario = await Scenario.init(
					'Setvalue',
					html(
						head(
							title('Setvalue'),
							model(
								mainInstance(t('data id="setvalue"', t('source'), t('g', t('destination')))),
								bind('/data/source').type('string'),
								bind('/data/g/destination').type('int')
							)
						),
						body(
							input(
								'/data/source',
								setvalueLiteral('xforms-value-changed', '/data/g/destination', '7')
							)
						)
					)
				);

				scenario.answer('/data/source', 'foo');

				expect(scenario.answerOf('/data/g/destination')).toEqualAnswer(intAnswer(7));
			});
		});

		describe('region repeats', () => {
			describe('[`setvalue`] source in repeat', () => {
				// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L251
				it('updates destination in the same repeat instance', async () => {
					const scenario = await Scenario.init(
						'Nested setvalue action with repeats',
						html(
							head(
								title('Nested setvalue action with repeats'),
								model(
									mainInstance(
										t(
											'data id="nested-setvalue-repeats"',
											t('repeat', t('source'), t('destination'))
										)
									),
									bind('/data/repeat/destination').type('int')
								)
							),
							body(
								repeat(
									'/data/repeat',
									input(
										'/data/repeat/source',
										setvalue('xforms-value-changed', '/data/repeat/destination', '4*position(..)')
									)
								)
							)
						)
					);

					const REPEAT_COUNT = 5;

					for (let i = 1; i <= REPEAT_COUNT; i++) {
						scenario.createNewRepeat('/data/repeat');
						expect(scenario.answerOf('/data/repeat[' + i + ']/destination').getValue()).toBe('');
					}

					for (let i = 1; i <= REPEAT_COUNT; i++) {
						scenario.answer('/data/repeat[' + i + ']/source', 7);
					}

					for (let i = 1; i <= REPEAT_COUNT; i++) {
						expect(scenario.answerOf('/data/repeat[' + i + ']/destination')).toEqualAnswer(
							intAnswer(4 * i)
						);
					}
				});

				it('updates the destination in only the same repeat instance', async () => {
					const scenario = await Scenario.init(
						'Nested setvalue action with repeats',
						html(
							head(
								title('Nested setvalue action with repeats'),
								model(
									mainInstance(
										t(
											'data id="nested-setvalue-repeats"',
											t('repeat', t('source'), t('destination'))
										)
									),
									bind('/data/repeat/destination').type('int')
								)
							),
							body(
								repeat(
									'/data/repeat',
									input(
										'/data/repeat/source',
										setvalue('xforms-value-changed', '/data/repeat/destination', '4*../source')
									)
								)
							)
						)
					);

					const REPEAT_COUNT = 5;

					for (let i = 1; i <= REPEAT_COUNT; i++) {
						scenario.createNewRepeat('/data/repeat');
						expect(scenario.answerOf('/data/repeat[' + i + ']/destination').getValue()).toBe('');
					}

					for (let i = 1; i <= REPEAT_COUNT; i++) {
						scenario.answer('/data/repeat[' + i + ']/source', i);
					}

					for (let i = 1; i <= REPEAT_COUNT; i++) {
						expect(scenario.answerOf(`/data/repeat[${i}]/source`)).toEqualAnswer(intAnswer(i));
						expect(scenario.answerOf(`/data/repeat[${i}]/destination`)).toEqualAnswer(
							intAnswer(i * 4)
						);
					}

					for (let i = 1; i <= REPEAT_COUNT; i++) {
						expect(scenario.answerOf('/data/repeat[' + i + ']/destination')).toEqualAnswer(
							intAnswer(4 * i)
						);
					}
				});
			});

			describe('`setvalue` at root', () => {
				// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L289
				it('sets value of node in first repeat instance', async () => {
					const scenario = await Scenario.init(
						'Setvalue into repeat',
						html(
							head(
								title('Setvalue into repeat'),
								model(
									mainInstance(
										t('data id="setvalue-into-repeat"', t('source'), t('repeat', t('destination')))
									)
								)
							),
							body(
								input(
									'/data/source',
									setvalue(
										'xforms-value-changed',
										'/data/repeat[position()=1]/destination',
										'/data/source'
									)
								),
								repeat('/data/repeat', input('/data/repeat/destination'))
							)
						)
					);

					scenario.createNewRepeat('/data/repeat');
					scenario.createNewRepeat('/data/repeat');
					scenario.createNewRepeat('/data/repeat');

					scenario.answer('/data/source', 'foo');

					expect(scenario.answerOf('/data/repeat[1]/destination').getValue()).toBe('foo');
					expect(scenario.answerOf('/data/repeat[2]/destination').getValue()).toBe('');
					expect(scenario.answerOf('/data/repeat[3]/destination').getValue()).toBe('');
					expect(scenario.answerOf('/data/repeat[4]/destination').getValue()).toBe('');
				});

				it("sets value of node in first repeat instance, as specified in the action's predicate", async () => {
					const scenario = await Scenario.init(
						'Setvalue into first repeat instance',
						html(
							head(
								title('Setvalue into first repeat instance'),
								model(
									mainInstance(
										t(
											'data id="setvalue-into-first-repeat-instance"',
											t('source'),
											t('repeat', t('destination'))
										)
									)
								)
							),
							body(
								input(
									'/data/source',
									setvalue(
										'xforms-value-changed',
										'/data/repeat[position()=1]/destination',
										'/data/source'
									)
								),
								repeat('/data/repeat', input('/data/repeat/destination'))
							)
						)
					);

					scenario.createNewRepeat('/data/repeat');
					scenario.createNewRepeat('/data/repeat');
					scenario.createNewRepeat('/data/repeat');

					expect(scenario.answerOf('/data/repeat[1]/destination').getValue()).toBe('');
					expect(scenario.answerOf('/data/repeat[2]/destination').getValue()).toBe('');
					expect(scenario.answerOf('/data/repeat[3]/destination').getValue()).toBe('');

					scenario.answer('/data/source', 'foo');

					expect(scenario.answerOf('/data/repeat[1]/destination').getValue()).toBe('foo');
					expect(scenario.answerOf('/data/repeat[2]/destination').getValue()).toBe('');
					expect(scenario.answerOf('/data/repeat[3]/destination').getValue()).toBe('');
				});

				// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L319
				it('sets value of node in repeat instance added after form load', async () => {
					const scenario = await Scenario.init(
						'Setvalue into repeat',
						html(
							head(
								title('Setvalue into repeat'),
								model(
									mainInstance(
										t('data id="setvalue-into-repeat"', t('source'), t('repeat', t('destination')))
									)
								)
							),
							body(
								input(
									'/data/source',
									setvalue(
										'xforms-value-changed',
										'/data/repeat[position()=2]/destination',
										'/data/source'
									)
								),
								repeat('/data/repeat', input('/data/repeat/destination'))
							)
						)
					);

					scenario.createNewRepeat('/data/repeat');
					scenario.createNewRepeat('/data/repeat');
					scenario.createNewRepeat('/data/repeat');

					scenario.answer('/data/source', 'foo');

					expect(scenario.answerOf('/data/repeat[2]/destination').getValue()).toBe('foo');
				});

				// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L348
				it('throws error when target is an unbound reference', async () => {
					const scenario = await Scenario.init(
						'Setvalue into repeat',
						html(
							head(
								title('Setvalue into repeat'),
								model(
									mainInstance(
										t('data id="setvalue-into-repeat"', t('source'), t('repeat', t('destination')))
									)
								)
							),
							body(
								input(
									'/data/source',
									setvalue('xforms-value-changed', '/data/repeat/destination', '/data/source')
								),
								repeat('/data/repeat', input('/data/repeat/destination'))
							)
						)
					);

					scenario.createNewRepeat('/data/repeat');
					scenario.createNewRepeat('/data/repeat');
					scenario.createNewRepeat('/data/repeat');
					const answer = () => {
						scenario.answer('/data/source', 'foo');
						expect.fail('Expected multiple node target to fail');
					};

					expect(answer).toThrowError('has more than one node');
				});
			});

			describe('`setvalue` in repeat', () => {
				// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L381
				it('sets value outside of repeat', async () => {
					const scenario = await Scenario.init(
						'Nested setvalue action with repeats',
						html(
							head(
								title('Nested setvalue action with repeats'),
								model(
									mainInstance(
										t(
											'data id="nested-setvalue-repeats"',
											t('destination', '0'),
											t('repeat', t('source'))
										)
									),
									bind('/data/destination').type('int')
								)
							),
							body(
								repeat(
									'/data/repeat',
									input(
										'/data/repeat/source',
										setvalue('xforms-value-changed', '/data/destination', '.+1')
									)
								)
							)
						)
					);

					scenario.createNewRepeat('/data/repeat');
					expect(scenario.answerOf('/data/destination')).toEqualAnswer(intAnswer(0));

					scenario.answer('/data/repeat[1]/source', 7);
					expect(scenario.answerOf('/data/destination')).toEqualAnswer(intAnswer(1));
				});
			});

			describe('`setvalue` in outer repeat', () => {
				// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L416
				it('sets inner repeat value', async () => {
					const scenario = await Scenario.init(
						'Nested repeats',
						html(
							head(
								title('Nested repeats'),
								model(
									mainInstance(
										t(
											'data id="nested-repeats"',
											t('repeat1', t('source'), t('repeat2', t('destination')))
										)
									)
								)
							),
							body(
								repeat(
									'/data/repeat1',
									input(
										'/data/repeat1/source',
										setvalue(
											'xforms-value-changed',
											'/data/repeat1/repeat2/destination',
											'../../source'
										)
									),
									repeat('/data/repeat1/repeat2', input('/data/repeat1/repeat2/destination'))
								)
							)
						)
					);

					scenario.answer('/data/repeat1[1]/source', 'foo');
					expect(scenario.answerOf('/data/repeat1[1]/repeat2[1]/destination').getValue()).toBe(
						'foo'
					);
				});
			});
		});

		describe('`setvalue`', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L448
			it('sets value of `readonly` field', async () => {
				const scenario = await Scenario.init(
					'Setvalue readonly',
					html(
						head(
							title('Setvalue readonly'),
							model(
								mainInstance(t('data id="setvalue-readonly"', t('readonly-field'))),
								bind('/data/readonly-field').readonly('1').type('int'),
								setvalue('odk-instance-first-load', '/data/readonly-field', '4*4')
							)
						),
						body(input('/data/readonly-field'))
					)
				);

				expect(scenario.answerOf('/data/readonly-field')).toEqualAnswer(intAnswer(16));
			});

			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L468
			describe('with inner empty string', () => {
				it('clears the `ref` target', async () => {
					const scenario = await Scenario.init(
						'Setvalue empty string',
						html(
							head(
								title('Setvalue empty string'),
								model(
									mainInstance(t('data id="setvalue-empty-string"', t('a-field', '12'))),
									bind('/data/a-field').type('int'),
									setvalue('odk-instance-first-load', '/data/a-field')
								)
							),
							body(input('/data/a-field'))
						)
					);
					expect(scenario.answerOf('/data/a-field').getValue()).toBe('');
				});
			});

			describe('with empty string `value` [attribute]', () => {
				// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L488
				it('clears the `ref` target', async () => {
					const scenario = await Scenario.init(
						'Setvalue empty string',
						html(
							head(
								title('Setvalue empty string'),
								model(
									mainInstance(t('data id="setvalue-empty-string"', t('a-field', '12'))),
									bind('/data/a-field').type('int'),
									setvalue('odk-instance-first-load', '/data/a-field', '')
								)
							),
							body(input('/data/a-field'))
						)
					);
					expect(scenario.answerOf('/data/a-field').getValue()).toBe('');
				});
			});

			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L508
			it('sets the value of multiple fields', async () => {
				const scenario = await Scenario.init(
					'Setvalue multiple destinations',
					html(
						head(
							title('Setvalue multiple destinations'),
							model(
								mainInstance(
									t(
										'data id="setvalue-multiple"',
										t('source'),
										t('destination1'),
										t('destination2')
									)
								),
								bind('/data/destination1').type('int'),
								bind('/data/destination2').type('int')
							)
						),
						body(
							input(
								'/data/source',
								setvalueLiteral('xforms-value-changed', '/data/destination1', '7'),
								setvalueLiteral('xforms-value-changed', '/data/destination2', '11')
							)
						)
					)
				);

				scenario.answer('/data/source', 'foo');

				expect(scenario.answerOf('/data/destination1')).toEqualAnswer(intAnswer(7));
				expect(scenario.answerOf('/data/destination2')).toEqualAnswer(intAnswer(11));
			});
		});

		describe('`xforms-value-changed`', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L534
			it('is triggered after a value change recompute', async () => {
				const scenario = await Scenario.init(
					'xforms-value-changed-event',
					html(
						head(
							title('Value changed event'),
							model(
								mainInstance(
									t(
										'data id="xforms-value-changed-event"',
										t('source'),
										t('calculate'),
										t('destination')
									)
								),
								bind('/data/calculate').type('int').calculate('/data/source * 2'),
								bind('/data/destination').type('int')
							)
						),
						body(
							input(
								'/data/source',
								setvalue('xforms-value-changed', '/data/destination', '/data/calculate')
							)
						)
					)
				);

				scenario.answer('/data/source', 12);

				expect(scenario.answerOf('/data/destination')).toEqualAnswer(intAnswer(24));
			});
		});

		describe('`setvalue`', () => {
			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L558
			it('sets the value of a bound attribute', async () => {
				const scenario = await Scenario.init(
					'Setvalue attribute',
					html(
						head(
							title('Setvalue attribute'),
							model(
								mainInstance(t('data id="setvalue-attribute"', t('element attr=""'))),
								setvalue('odk-instance-first-load', '/data/element/@attr', '7')
							)
						),
						body(input('/data/element'))
					)
				);

				expect(scenario.attributeOf('/data/element', 'attr').getValue()).toBe('7');
			});

			// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/core/model/actions/SetValueActionTest.java#L577
			it('sets the value of a bound attribute, after deserialization', async () => {
				const scenario = await Scenario.init(
					'Setvalue attribute',
					html(
						head(
							title('Setvalue attribute'),
							model(
								mainInstance(t('data id="setvalue-attribute"', t('element attr=""'))),
								setvalue('odk-instance-first-load', '/data/element/@attr', '7')
							)
						),
						body(input('/data/element'))
					)
				);

				expect(scenario.attributeOf('/data/element', 'attr').getValue()).toBe('7');
				const cached = await scenario.proposed_serializeAndRestoreInstanceState();
				const newInstance = cached.newInstance();
				expect(newInstance.attributeOf('/data/element', 'attr').getValue()).toBe('7');
			});
		});
	});

	describe('XFormParserTest.java', () => {
		// ported from: https://github.com/getodk/javarosa/blob/2dd8e15e9f3110a86f8d7d851efc98627ae5692e/src/test/java/org/javarosa/xform/parse/XFormParserTest.java#L462
		it('sets default value', async () => {
			const scenario = await Scenario.init('default_test.xml');

			expect(scenario.getInstanceNode('/data/string_val').currentState.value).toBe('string-value');
			expect(scenario.getInstanceNode('/data/inline_val').currentState.value).toBe('inline-value');
		});
	});
});
