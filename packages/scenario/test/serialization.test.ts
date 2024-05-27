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
import { Scenario } from '../src/jr/Scenario.ts';
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
