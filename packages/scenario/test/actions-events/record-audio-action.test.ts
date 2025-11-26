import {
	body,
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
import { CapturingRecordAudioActionListener } from '../../src/audio/CapturingRecordAudioActionListener.ts';
import { RecordAudioActions } from '../../src/audio/RecordAudioActions.ts';
import { Scenario, getRef } from '../../src/jr/Scenario.ts';
import type { JRFormDef } from '../../src/jr/form/JRFormDef.ts';

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
							t('odk:recordaudio event="odk-instance-load" ref="/data/recording" odk:quality="foo"')
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
							t('odk:recordaudio event="odk-instance-load" ref="/data/recording" odk:quality="foo"')
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
