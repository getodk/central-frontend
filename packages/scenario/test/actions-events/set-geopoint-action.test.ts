import { describe, expect, it } from 'vitest';
import { stringAnswer } from '../../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../src/jr/Scenario.ts';
import { r } from '../../src/jr/resource/ResourcePathHelper.ts';

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
