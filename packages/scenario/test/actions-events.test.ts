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
import { Scenario } from '../src/jr/Scenario.ts';

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
});
