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

interface TitleOptions {
	readonly temporarilyAddFormTitleElement: boolean;
}

describe('`<label>` and/or `<hint>` text', () => {
	describe('XFormParserTest.java', () => {
		type AssertOutputNameValues =
			// eslint-disable-next-line @typescript-eslint/sort-type-constituents
			'JR_PLACEHOLDER_DIRECT_PORT' | 'BLANK' | 'POPULATED';

		interface SpacesBetweenOutputTagsOptions extends TitleOptions {
			readonly assertOutputNameValues: AssertOutputNameValues;
		}

		/**
		 * **PORTING NOTES**
		 *
		 * - Fails as directly ported, as we presently expect a form definition to
		 *   explicitly include a `<h:title>`. An alternate parameterization of the
		 *   test includes a title so that the rest of the test may proceed.
		 *
		 * - JavaRosa produces "placeholders" where outputs are expected in a
		 *   label/hint's "inner" text; the output values are substituted after the
		 *   fact. The direct port of this test fails, because we include output
		 *   results in our label/text serialization. (While it isn't presently
		 *   addressed besides type stubs, we anticipate retaining a structural
		 *   distinction between outputs and surrounding text when we address
		 *   limited Markdown/HTML feature support.)
		 *
		 *   The `assertOutputNameValues` parameter demonstrates this difference in
		 *   behavior, where the option:
		 *
		 *     - `JR_PLACEHOLDER_DIRECT_PORT`:
		 *         - `first_name` and `last_name` fields are blank
		 *         - label text assertion expects JavaRosa's expected placeholders
		 *         - assertion fails (web forms doesn't produce output placeholders)
		 *
		 *     - `BLANK`:
		 *         - `first_name` and `last_name` fields are blank
		 *         - label text assertion expects only `nbsp` preservation
		 *         - assertion passes
		 *
		 *     - `POPULATED`:
		 *         - `first_name` and `last_name` fields are non-blank
		 *         - assertion expects `first_name` + `nbsp` + `last_name`
		 *         - assertion passes
		 *
		 * - Rephrase test description? "Preserves" seems more clear in intent.
		 */
		describe.each<SpacesBetweenOutputTagsOptions>([
			{
				temporarilyAddFormTitleElement: false,
				assertOutputNameValues: 'JR_PLACEHOLDER_DIRECT_PORT',
			},
			{ temporarilyAddFormTitleElement: true, assertOutputNameValues: 'BLANK' },
			{ temporarilyAddFormTitleElement: true, assertOutputNameValues: 'POPULATED' },
		])(
			'temporarily add form title element: $temporarilyAddFormTitleElement; replace JR output placeholders with expected text: $replaceJROutputPlaceholdersWithExpectedText; set name values: $setNameValues',
			({ temporarilyAddFormTitleElement, assertOutputNameValues }) => {
				let testFn: typeof it | typeof it.fails;

				if (
					temporarilyAddFormTitleElement &&
					assertOutputNameValues !== 'JR_PLACEHOLDER_DIRECT_PORT'
				) {
					testFn = it;
				} else {
					testFn = it.fails;
				}

				testFn(
					'[preserves spaces between `<output>` tags?] spaces between `<output>`s are respected',
					async () => {
						let firstNameValue: string;
						let lastNameValue: string;

						if (assertOutputNameValues === 'POPULATED') {
							firstNameValue = 'Bobby';
							lastNameValue = 'Tables';
						} else {
							firstNameValue = '';
							lastNameValue = '';
						}

						const scenario = await Scenario.init(
							'spaces-outputs',
							html(
								head(
									...(temporarilyAddFormTitleElement ? [title('spaces-outputs')] : []),
									model(
										mainInstance(
											t(
												'data id="spaces-outputs"',
												t('first_name', firstNameValue),
												t('last_name', lastNameValue),
												t('question')
											)
										),
										bind('/data/question').type('string')
									)
								),
								body(
									input(
										'/data/question',
										t(
											'label',
											'Full name: <output value=" ../first_name "/>\u00A0<output value=" ../last_name "/>'
										)
									)
								)
							)
						);

						scenario.next('/data/question');

						// String innerText = scenario.getQuestionAtIndex().getLabelInnerText();
						const text = scenario.proposed_getQuestionLabelText({
							assertCurrentReference: '/data/question',
						});

						// JR:
						//
						// char nbsp = 0x00A0;
						const nbsp = '\u00a0';

						// JR:
						//
						// String expected = "Full name: ${0}" + nbsp + "${1}";
						let expected: string;

						if (assertOutputNameValues === 'JR_PLACEHOLDER_DIRECT_PORT') {
							expected = 'Full name: ${0}' + nbsp + '${1}';
						} else {
							expected = `Full name: ${firstNameValue}${nbsp}${lastNameValue}`;
						}

						expect(text).toEqual(expected);
					}
				);
			}
		);
	});
});
