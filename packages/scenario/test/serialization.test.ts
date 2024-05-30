import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import type { EngineConfig, InitializeFormOptions } from '@getodk/xforms-engine';
import { describe, expect, it } from 'vitest';
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';
import { setUpSimpleReferenceManager } from '../src/jr/reference/ReferenceManagerTestUtils.ts';
import { r } from '../src/jr/resource/ResourcePathHelper.ts';
import { nullValue } from '../src/value/ExpectedNullValue.ts';

// Ported as of https://github.com/getodk/javarosa/commit/5ae68946c47419b83e7d28290132d846e457eea6
describe('Serialization', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * Discussing these tests in Slack, it was determined that they're not
	 * currently applicable to the web forms project. The first test is ported
	 * largely because it was already most of the way there by this point,
	 * although much of the supporting logic for a more faithful port has been
	 * omitted for now (with some breadcrumbs on thinking behind that supporting
	 * logic left in for posterity in case it becomes applicable in the future).
	 *
	 * We reached the conclusion to defer porting the rest of these tests for now,
	 * on the basis that the current serialization functionality under test is in
	 * support of specific performance optimizations; that the tests exercise
	 * implementation details not directly pertinent to web forms at this time;
	 * that the performance optimizations in question are themselves not likely to
	 * be pertinent to web forms, at least at this time.
	 *
	 * We also agreed that this note would serve as an explanation of the above,
	 * as well as an opportunity to briefly mention that we may have other reasons
	 * to support (de)serialization, and to test that support, likely around
	 * offline functionality. As such, we may want to revisit these skipped
	 * JavaRosa tests if they seem valuable for that effort when we get to it.
	 */
	describe.skip('FormDefSerializationTest.java', () => {
		const getSimplestFormScenario = async (): Promise<Scenario> => {
			return Scenario.init(
				'Simplest',
				html(
					head(
						title('Simplest'),
						model(mainInstance(t('data id="simplest"', t('a'))), bind('/data/a').type('string'))
					),
					body(input('/data/a'))
				)
			);
		};

		describe('instance name', () => {
			describe('for reference in main instance', () => {
				it.skip('is always null', async () => {
					const scenario = await getSimplestFormScenario();

					scenario.next('/data/a');

					expect(scenario.refAtIndex().getInstanceName()).toEqual(nullValue());

					const deserialized = await scenario.serializeAndDeserializeForm();

					deserialized.next('/data/a');

					expect(deserialized.refAtIndex().getInstanceName()).toEqual(nullValue());
				});

				it.skip('instanceName_forFormDefEvaluationContext_isAlwaysNull');
				it.skip('instanceName_forFormDefMainInstance_isAlwaysNull');
			});
		});
	});
});

describe('SameRefDifferentInstancesIssue449Test.java (regression tests)', () => {
	describe('form with same ref in different instances', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * - Fails before call to {@link Scenario.serializeAndDeserializeForm}.
		 *   Pending support for external secondary instances.
		 *
		 * - Test may not be pertinent, see notes on `FormDefSerializationTest.java`
		 *   suite. Logic was already ported before I looked up and remembered that!
		 *
		 * - If we determine this test is pertinent... rephrase?
		 *   "Successfully" in a test description is implied, like "correct". Prefer
		 *   to describe actual behavior under test, which is vague here.
		 */
		it.fails('is [~~]successfully[~~] deserialized', async () => {
			const formFile = r('issue_449.xml');
			setUpSimpleReferenceManager(formFile.getParent(), 'file');

			const scenario = await Scenario.init(formFile);

			scenario.answer('/data/new-part', 'c');

			expect(scenario.answerOf('/data/aggregated')).toEqualAnswer(stringAnswer('a b c'));

			const deserialized = await scenario.serializeAndDeserializeForm();

			expect(deserialized.answerOf('/data/new-part[0]')).toEqualAnswer(stringAnswer('c'));
			expect(deserialized.answerOf('/data/aggregated[0]')).toEqualAnswer(stringAnswer('a b c'));

			deserialized.answer('/data/new-part', 'c2');

			expect(deserialized.answerOf('/data/aggregated[0]')).toEqualAnswer(stringAnswer('a b c2'));
		});

		it.skip('[applies constraints] constraints are correctly applied after deserialization');
	});
});

describe('ExternalSecondaryInstanceParseTest.java', () => {
	describe('form with external secondary XML instance', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * If porting this test becomes a priority, note that all of the
		 * functionality under test currently exercies implementation details of
		 * {@link FormParserHelper}. There's currently no analogue to that in the
		 * engine/client interface, and it isn't anticipated that we'd introduce one
		 * in the foreseeable future.
		 */
		it.skip('should serialize and deserialize');
	});

	describe('deserialized form [~~]def[~~] created from a form with external secondary XML instance', () => {
		it.skip('should contain that external instance');
	});

	describe('//region Missing external file', () => {
		it.skip(
			'realInstanceIsResolved_whenFormIsDeserialized_afterPlaceholderInstanceUsed_andFileNowExists'
		);

		/**
		 * **PORTING NOTES**
		 *
		 * It sounds (from the JavaRosa comment, preserved below) like the
		 * conceptual model here is:
		 *
		 * 0. Given a form with external instance reference, and given an initial
		 *    inability to retrieve the resource for it
		 * 1. JavaRosa will produce a "placeholder" (empty instance representation)
		 *    for the unavailable resource
		 * 2. A client (Collect) may at some point serialize the form state
		 * 3. The client may then attempt to deserialize that serialization, calling
		 *    into JavaRosa to do so
		 * 4. Because(?) JavaRosa used a "placeholder" prior to that serialization,
		 *    upon deserialization it will once again attempt to retrieve the
		 *    external instance resource
		 * 5. While parsing will produce a "placeholder" for an unretrievable
		 *    external instance resource, deserialization will produce an error
		 *    instead.
		 * 6. It is expected that a client will resolve this error condition by
		 *    bypassing deserialization (and potentially discarding the serialized
		 *    state?), by re-parsing the form... thereby allowing JavaRosa to once
		 *    again produce a "placeholder".
		 *
		 * It's unclear if any of this is pertinent to web forms, but it's hard not
		 * to ask... if this mental model is roughly correct:
		 *
		 * - Is this ceremony something essential to the distinction between "parse"
		 *   and "deserialize"? Is there additional mental model to help make the
		 *   distinction more clear?
		 *
		 * - Insofar as we may find ourselves implementing similar logic (albeit
		 *   serving other purposes), how can we establish a clear interface
		 *   contract around behaviors like this? Should it be more consistent? Does
		 *   our current {@link EngineConfig.fetchResource} option—configurable in
		 *   {@link InitializeFormOptions}—provide enough informational surface area
		 *   to communicate such intent (and allow both clients and engine alike to
		 *   have clarity of that intent at call/handling sites)?
		 *
		 * - - -
		 *
		 * JR:
		 *
		 * Clients would typically catch this exception and try parsing the form
		 * again which would succeed by using the placeholder.
		 */
		it.skip(
			'fileNotFoundException_whenFormIsDeserialized_afterPlaceholderInstanceUsed_andFileStillMissing'
		);

		/**
		 * **PORTING NOTES**
		 *
		 * The original notes below were answered with
		 * {@link https://github.com/getodk/web-forms/pull/110#discussion_r1614139373 | this excellent explanation}:
		 *
		 * > This is the result of a bunch of implementation details/decisions in JR
		 * > and Collect. As you've noted in some earlier tests, lists of select
		 * > options are not part of the DAG/recomputation model. Choice lists are
		 * > only computed when they need to be displayed. In some cases, this can
		 * > result in a significant perf improvement.
		 * >
		 * > So the choicesOf call computes the choices. And that's fine even if the
		 * > references for label and name don't exist because that just returns the
		 * > entirety of every choice item. It's only when a selection is made that
		 * > there's an attempt to use the specified references and that causes a
		 * > crash.
		 *
		 * - - -
		 *
		 * Expanding on the mental model we're trying to form in the skipped test
		 * directly above...
		 *
		 * - If this produces an error condition, why is it deferred to _accessing a
		 *   select's available itemset choices_?
		 *
		 * - The JavaRosa comment, preserved below, suggests that the error should
		 *   occur "when making a choice". That makes it sound like the intent is:
		 *
		 *     0. Parsing fails to resolve an external instance resource, producing
		 *        a "placeholder" representation.
		 *
		 *     1. Deserialization resolves that resource.
		 *
		 *     2. This is considered an inconsistent state, which cannot be
		 *        reconciled on the deserialized state.
		 *
		 *     3. An allowance is made for operating on form state with this
		 *        inconsistency **so long as the inconsistency isn't consulted in a
		 *        subsequent state change**.
		 *
		 *     If that's the case... why isn't the error produced on a write call,
		 *     rather than when attempting to read the options? Wouldn't this
		 *     produce an error by simply proceeding through the deserialized form
		 *     state without making any state change at all?
		 *
		 * - - -
		 *
		 * JR:
		 *
		 * It would be possible for a formdef to be serialized without access to the
		 * external secondary instance and then deserialized with access. In that
		 * case, there's nothing to validate that the value and label references for
		 * a dynamic select correspond to real nodes in the secondary instance so
		 * there's a runtime exception when making a choice.
		 */
		it.skip(
			'exceptionFromChoiceSelection_whenFormIsDeserialized_afterPlaceholderInstanceUsed_andFileMissingColumns'
		);
	});
});
