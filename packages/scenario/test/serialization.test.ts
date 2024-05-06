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
