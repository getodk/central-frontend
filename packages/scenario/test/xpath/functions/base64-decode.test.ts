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
import { stringAnswer } from '../../../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../../src/jr/Scenario.ts';

/**
 * **PORTING NOTES**
 *
 * These tests are ported from JavaRosa as part of the overall test porting
 * effort. Absent other changes to our current testing strategy, they would
 * likely be better suited for more direct tests in the `xpath` package. We can
 * decide whether it makes sense to keep them here, move them to `xpath` (likely
 * converted to the format that's common of tests there), or establish some
 * other preference for testing XPath functionality.
 *
 * My initial inclination was to convert and move them to the `xpath` package
 * immediately, but I held off because:
 *
 * 1. This is a good opportunity to consider the XPath testing strategy overall.
 *    It's noteworthy that a huge chunk of tests we're going to skip in this big
 *    (first?) porting push exercise other XPath functionality. And while XPath
 *    functionality has by far the strongest coverage up to this point, a few
 *    nuanced differences with JavaRosa have already been picked up in a handful
 *    of ported tests that also exercise XPath functionality, and I expect we'd
 *    benefit overall by sharing a great deal more XPath test coverage with
 *    JavaRosa across the board.
 *
 * 2. It'll be easier to track and discuss this if it follows the same general
 *    porting strategy as everything else.
 *
 * 3. It would be rather easier to miss the known failures indefinitely there,
 *    when we're otherwise tracking them in `scenario`.
 *
 * My hunch is that the best first step is to file an issue for feature support,
 * and defer any decision on where/how to test it until implementation.
 *
 * Other upfront observations:
 *
 * - It was initially surprising that we didn't have tests for this function
 *   already. It appears to be relatively new to the spec, introduced shortly
 *   after the web forms `xpath` package was initially added.
 *
 * - Given we don't currently implement the function, it's expected that all of
 *   the ported tests will initially fail pending implementation.
 *
 * - I was confused by its placement in the spec under
 *   {@link https://getodk.github.io/xforms-spec/#fn:Geographic-Functions | Geographic Functions}.
 *   It seems likely this was unintended, and the function was just added "at
 *   the end". There are a handful of other functions in the spec document that
 *   seem to have an odd place in the information hierarchy.
 *
 * - I'd like to propose **at least** a pass to find better placement for this
 *   and those handful of other functions. I'd also like to potentially
 *   reconsider the table-with-headings structure of the XPath Functions
 *   catalogue overall: besides being prone to the observed organizational
 *   confusion, the markup semantics seem poorly structured for accessibility,
 *   and I've generally found it fussy for navigation.
 *
 * - The first five tests feel well suited for a parameterized/table test.
 *
 * Slightly after upfront:
 *
 * - Evidently the first five tests were originally parameterized, and that was
 *   relaxed to a shared setup function in review. Something to keep in mind for
 *   prospects of sharing with JavaRosa.
 *
 * Overall, for consideration when we implement the feature/decide how to
 * approach its testing:
 *
 * - It's concerning that all of the tests are concerned with text data. It's
 *   good that there's a range of unicode tests, but it's notable that at least
 *   one has been noted for its curious behavior with the unicode input text
 *   producing "garbage" code points. I'd like to consider tests exercising
 *   non-text input, for instance some of the binary data associated with
 *   formats we presently support in itext media.
 *
 * - I would like to consider whether the spec should include a parameter to
 *   specify the content type of the encoded input.
 */
describe('XPath function support: `base64-decode`', () => {
	describe('Base64DecodeTest.java', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * In JavaRosa, the second parameter to the method of this name is called
		 * "source", which I found confusing. It's renamed to `encodedText` here for
		 * some additional clarity.
		 */
		const getBase64DecodeScenario = async (
			testName: string,
			encodedText: string
		): Promise<Scenario> => {
			return Scenario.init(
				testName,
				html(
					head(
						title(testName),
						model(
							mainInstance(t('data id="base64"', t('text', encodedText), t('decoded'))),
							bind('/data/text').type('string'),
							bind('/data/decoded').type('string').calculate('base64-decode(/data/text)')
						)
					),
					body(input('/data/text'))
				)
			);
		};

		describe('ASCII string', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Fails pending feature support.
			 */
			it.fails('is successfully decoded', async () => {
				const scenario = await getBase64DecodeScenario('ASCII string', 'SGVsbG8=');

				expect(scenario.answerOf('/data/decoded')).toEqualAnswer(stringAnswer('Hello'));
			});
		});

		describe('example from Saxonica', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Fails pending feature support.
			 */
			it.fails('is successfully decoded', async () => {
				const scenario = await getBase64DecodeScenario('Example from Saxonica', 'RGFzc2Vs');

				expect(scenario.answerOf('/data/decoded')).toEqualAnswer(stringAnswer('Dassel'));
			});
		});

		describe('accent string', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Fails pending feature support.
			 */
			it.fails('is successfully decoded', async () => {
				const scenario = await getBase64DecodeScenario(
					'String with accented characters',
					'w6nDqMOx'
				);

				expect(scenario.answerOf('/data/decoded')).toEqualAnswer(stringAnswer('éèñ'));
			});
		});

		describe('emoji string', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Fails pending feature support.
			 */
			it.fails('is successfully decoded', async () => {
				const scenario = await getBase64DecodeScenario('String with emoji', '8J+lsA==');

				expect(scenario.answerOf('/data/decoded')).toEqualAnswer(stringAnswer('🥰'));
			});
		});

		describe('utf-16 string', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Why is this "garbage"? As far as I could tell, the expected string is
			 *   correct/equivalent unicode code points.
			 *
			 * - Fails pending feature support.
			 */
			it.fails('is decoded to [unicode code points] garbage', async () => {
				const scenario = await getBase64DecodeScenario('UTF-16 encoded string', 'AGEAYgBj');

				expect(scenario.answerOf('/data/decoded')).toEqualAnswer(
					stringAnswer('\u0000a\u0000b\u0000c')
				); // source string: "abc" in UTF-16
			});
		});

		/**
		 * **PORTING NOTES**
		 *
		 * Description derived from ported test method name, but it's redundant
		 * here. It's currently included as a way to help trace the test back to its
		 * JavaRosa equivalent.
		 */
		describe('`base64-decode` function', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - If we keep these tests here, rephrase? If we move testing of the
			 *   function into the `xpath` package, it's at least currently expected
			 *   that it will throw. That said, it would be worth considering whether
			 *   we want to produce Result types throughout the full engine stack.
			 *   Otherwise the assumption would be that the engine needs to catch any
			 *   XPath evaluation errors and produce errors in a Result as appropriate
			 *   type from there.
			 *
			 * - Test currently passes for the wrong reason (pending feature support,
			 *   rather than an arity check), but it's not clear that we have a
			 *   reliable/stable means to test for that at this layer. This seems fine
			 *   for now, as it'll either pass or fail on the merits when the feature
			 *   implemented (if we decide to keep testing it here).
			 *
			 * A few deviations from directly porting this test:
			 *
			 * - We don't assign the {@link Scenario} instance to anything, as it's
			 *   never referenced. It seems unlikely this would make a difference in
			 *   JavaRosa, but calling it out because I've been surprised by weird
			 *   Java semantics before!
			 *
			 * - We don't check for a specific error/exception type. That would
			 *   already be more platform specific than we want, but it'll also be
			 *   more flexible when we move toward the engine producing Result types
			 *   for fallible calls.
			 */
			it('[produces an error] throws when not exactly one arg', async () => {
				const init = async () => {
					await Scenario.init(
						'Invalid base64 string',
						html(
							head(
								title('Invalid base64 string'),
								model(
									mainInstance(t('data id="base64"', t('text', 'a'), t('decoded'))),
									bind('/data/text').type('string'),
									bind('/data/decoded').type('string').calculate('base64-decode()')
								)
							),
							body(input('/data/text'))
						)
					);
				};

				await expect(init).rejects.toThrowError();
			});

			/**
			 * **PORTING NOTES**
			 *
			 * - Typical `nullValue()` -> blank/empty string check.
			 *
			 * - Fails pending feature support.
			 */
			it.fails('returns [an] empty string [for invalid input] when input invalid', async () => {
				const scenario = await Scenario.init(
					'Invalid base64 string',
					html(
						head(
							title('Invalid base64 string'),
							model(
								mainInstance(t('data id="base64"', t('text', 'a'), t('decoded'))),
								bind('/data/text').type('string'),
								bind('/data/decoded').type('string').calculate('base64-decode(/data/text)')
							)
						),
						body(input('/data/text'))
					)
				);

				// assertThat(scenario.answerOf("/data/decoded"), is(nullValue()));
				expect(scenario.answerOf('/data/decoded').getValue()).toBe('');
			});
		});
	});
});
