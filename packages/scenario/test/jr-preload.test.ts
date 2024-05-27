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
import type { ComparableAnswer } from '../src/answer/ComparableAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';

describe('`jr:preload`', () => {
	describe('QuestionPreloaderTest.java', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * - Rephrase? Name alludes to an aspect of implementation.
		 *
		 * - All tests currently fail pending either `jr:preload` feature support,
		 *   or support for attribute bindings (or both in the case of one alternate
		 *   approach).
		 *
		 * - There are several different
		 *   {@link https://getodk.github.io/xforms-spec/#preload-attributes | preload attributes, parameters, and events}
		 *   to consider for expansion of this suite.
		 */
		describe('preloader', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * - Rephrase?
			 *
			 * - Unlike other conversions of `getDisplayText`, assertions here reference
			 *   the {@link ComparableAnswer} (`actual` value) to utilize a custom
			 *   `toStartWith` assertion generalized over answer types.
			 */
			it.fails('preloads [specified data in bound] elements', async () => {
				const scenario = await Scenario.init(
					'Preload attribute',
					html(
						head(
							title('Preload element'),
							model(
								mainInstance(t('data id="preload-attribute"', t('element'))),
								bind('/data/element').preload('uid')
							)
						),
						body(input('/data/element'))
					)
				);

				expect(scenario.answerOf('/data/element')).toStartWith('uuid:');
			});

			/**
			 * **PORTING NOTES**
			 *
			 * The first test is directly ported from JavaRosa. The comment below,
			 * also ported from JavaRosa, was initially surprising! Glancing at the
			 * {@link https://github.com/getodk/javarosa/pull/698 | pull request}
			 * which added the test:
			 *
			 * 1. The test originally exercised the expected behavior, and was ignored
			 *    because it failed.
			 *
			 * 2. PR feedback requested the test document existing behavior, with a
			 *    comment explaining that the behavior does not match expectations.
			 *
			 * It appears that JUnit does not have an equivalent to {@link it.fails},
			 * which we use here as an alternate approach. Absent that, it seems
			 * likely we'd end up with the same approach as JavaRosa took. But since
			 * we _do have_ this convenient mechanism to express the actual expected
			 * behavior, and to mark it failing (as we've done for many other tests
			 * ported from JavaRosa), it makes sense to reframe the test that way
			 * here.
			 *
			 * - - -
			 *
			 * Editorial: without going on a side quest to learn about any
			 * extensibility provided by JUnit, I couldn't say whether it'd be trivial
			 * to express something similar to {@link it.fails} in JavaRosa. But given
			 * the chance, I would likely apply the same logic from the linked PR
			 * above to many JavaRosa tests currently marked `@Ignore`. In general, my
			 * approach in porting these JavaRosa tests has been to strongly favor
			 * {@link it.fails} over, say, {@link it.skip} or even {@link it.todo},
			 * unless I'm absolutely sure that the test is impertinent. As with the
			 * feedback in that PR, I believe we'll benefit from knowing when behavior
			 * under test changes—even when the change is possibly orthogonal to our
			 * concerns, but **especially** when the behavior becomes more consistent
			 * with our expectations.
			 *
			 * - - -
			 *
			 * JR: Unintentional limitation
			 */
			describe('[direct port/alternate]', () => {
				it.fails('does not preload attributes', async () => {
					const scenario = await Scenario.init(
						'Preload attribute',
						html(
							head(
								title('Preload attribute'),
								model(
									mainInstance(t('data id="preload-attribute"', t('element attr=""'))),
									bind('/data/element/@attr').preload('uid')
								)
							),
							body(input('/data/element'))
						)
					);

					expect(scenario.answerOf('/data/element/@attr').getValue()).toBe('');
				});

				/**
				 * **PORTING NOTES**
				 *
				 * This alternate approach looks more like the first ported test, and is
				 * presumably pretty close to what it'd look like if JavaRosa also
				 * supported the functionality. As such, it also uses the same
				 * `toStartWith` assertion extension in place of `getDisplayText`.
				 */
				it.fails('preloads [specified data in bound] attributes (alternate)', async () => {
					const scenario = await Scenario.init(
						'Preload attribute',
						html(
							head(
								title('Preload attribute'),
								model(
									mainInstance(t('data id="preload-attribute"', t('element attr=""'))),
									bind('/data/element/@attr').preload('uid')
								)
							),
							body(input('/data/element'))
						)
					);

					expect(scenario.answerOf('/data/element/@attr')).toStartWith('uuid:');
				});
			});
		});
	});
});
