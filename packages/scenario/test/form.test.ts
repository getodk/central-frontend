import {
	bind,
	body,
	head,
	html,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

/**
 * **PORTING NOTES** (Non-porting notes)
 *
 * This module/suite does not (currently) include any actual tests ported from
 * JavaRosa. It occurred to me to add it because one of the parsing tests in
 * `ExternalSecondaryInstanceParseTest.java` references JavaRosa's
 * `FormDef.title`, and we currently have an
 * {@link https://github.com/getodk/web-forms/issues/75 | outstanding issue}
 * around our initial failure to include an explicit engine/client interface to
 * forms' titles. It appears, at a glance in the aforementioned test "vat", that
 * JavaRosa treats form titles as a static parsing concern. This is
 * unsurprising, as they're also presently treated as static in the spec. Part
 * of the motivation for us to file the linked issue is that form title
 * translation is an obvious potential use case (and one users have requested)
 * which we may be better off anticipating when we do finally address that
 * interface oversight. As such, it seems sensible to add a failing test stub
 * for now connecting these various thoughts. When the test is complete and
 * passing, we may want to remove this entire comment.
 */
describe('Form-wide functionality', () => {
	/**
	 * @todo When these tests are resolved, consider whether it would be
	 * appropriate to remove the "PORTING NOTES" comment above.
	 */
	describe('form title', () => {
		it.fails('gets a static form title', async () => {
			const staticTitle = 'Static form title';

			const scenario = await Scenario.init(
				staticTitle,
				html(
					head(
						title(staticTitle),
						model(mainInstance(t('data id="static-title-test-form"', t('a'))), bind('/data/a'))
					),
					body()
				)
			);

			expect(scenario.proposed_getTitle()).toBe(staticTitle);
		});

		/**
		 * @todo If this functionality were to exist, it would be based on a spec
		 * change to support it. While a translated title definition would probably
		 * have a pretty predictable format, it doesn't seem predictable _enough_
		 * to warrant speculating on what the fixture would look like yet.
		 */
		it.todo('gets a translated form title');
	});
});
