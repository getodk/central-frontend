import {
	bind,
	body,
	head,
	html,
	input,
	label,
	labelRef,
	mainInstance,
	model,
	repeat,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';
import { JRFormEntryCaption } from '../src/jr/caption/JRFormEntryCaption.ts';

/**
 * **PORTING NOTES**
 *
 * There may be a more general category of multi-feature-interaction to be
 * found. This is the most obvious at time of porting.
 */
describe('Interaction between `<repeat>` and `<output>`', () => {
	describe('FormDefTest.java', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * Rephrase? Unclear what "fill" was meant to reference here.
		 */
		describe('[output?] fill template string', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * {@link JRFormEntryCaption} is stubbed, to fail on invocation. An
			 * alternate test follows, exercising the apparent intent of this ported
			 * test with a proposed addition to the {@link Scenario} API.
			 */
			describe('[direct port/alternate - output resolves relative references]', () => {
				it.fails('resolves relative references', async () => {
					const scenario = await Scenario.init(
						'<output> with relative ref',
						html(
							head(
								title('output with relative ref'),
								model(
									mainInstance(
										t(
											'data id="relative-output"',
											t('repeat jr:template=""', t('position'), t('position_in_label'))
										)
									),
									bind('/data/repeat/position').type('int').calculate('position(..)'),
									bind('/data/repeat/position_in_label').type('int')
								)
							),
							body(
								repeat(
									'/data/repeat',
									input(
										'/data/repeat/position_in_label',
										label('Position: <output value=" ../position "/>')
									)
								)
							)
						)
					);

					scenario.next('/data/repeat');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/repeat',
					});
					scenario.next('/data/repeat[1]/position_in_label');

					// FormEntryCaption caption = new FormEntryCaption(scenario.getFormDef(), scenario.getCurrentIndex());
					let caption = new JRFormEntryCaption(scenario.getFormDef(), scenario.getCurrentIndex());

					expect(caption.getQuestionText()).toBe('Position: 1');

					scenario.next('/data/repeat');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/repeat',
					});
					scenario.next('/data/repeat[2]/position_in_label');

					// caption = new FormEntryCaption(scenario.getFormDef(), scenario.getCurrentIndex());
					caption = new JRFormEntryCaption(scenario.getFormDef(), scenario.getCurrentIndex());

					expect(caption.getQuestionText()).toBe('Position: 2');
				});

				it('produces the output of an expression with a relative reference (alternate)', async () => {
					const scenario = await Scenario.init(
						'<output> with relative ref',
						html(
							head(
								title('output with relative ref'),
								model(
									mainInstance(
										t(
											'data id="relative-output"',
											t('repeat jr:template=""', t('position'), t('position_in_label'))
										)
									),
									bind('/data/repeat/position').type('int').calculate('position(..)'),
									bind('/data/repeat/position_in_label').type('int')
								)
							),
							body(
								repeat(
									'/data/repeat',
									input(
										'/data/repeat/position_in_label',
										label('Position: <output value=" ../position "/>')
									)
								)
							)
						)
					);

					scenario.next('/data/repeat');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/repeat',
					});
					scenario.next('/data/repeat[1]/position_in_label');

					expect(
						scenario.proposed_getQuestionLabelText({
							assertCurrentReference: '/data/repeat[1]/position_in_label',
						})
					).toBe('Position: 1');

					scenario.next('/data/repeat');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/repeat',
					});
					scenario.next('/data/repeat[2]/position_in_label');

					expect(
						scenario.proposed_getQuestionLabelText({
							assertCurrentReference: '/data/repeat[2]/position_in_label',
						})
					).toBe('Position: 2');
				});
			});

			/**
			 * **PORTING NOTES**
			 *
			 * - The notes on the direct port/alternate pair above also apply to this
			 *   direct port and its alternates.
			 *
			 * - The ported test does not appear to exercise the functionality
			 *   expressed in the test description: while the form fixture does
			 *   include a `jr:itext` definition with an `<output>` as described, the
			 *   label under test does not reference it with a `jr:itext()` call to
			 *   its id. Instead, the label is defined an inline `<output>` just as
			 *   the previous port/alternate pair does. Observing this apparent
			 *   discrepancy, an **additional alternate** test is included which fully
			 *   exercises the test's apparent intent.
			 *
			 * - (Prediction) At time of writing, it is anticipated that the first
			 *   alternate will pass, and the second alternate will fail. This is
			 *   because we do not yet support `<output>` in itext definitions at all.
			 *
			 * - (Confirmation) The first alternate did pass, and second did fail, as
			 *   expected. A minor surprise detail was also discovered: because web
			 *   forms does not yet support `<output>` in itext translations, it was
			 *   expected that the first label text assertion would fail with:
			 *
			 *     - Expected: "Position: 1"
			 *     - Received: "Position:"
			 *
			 *     It initially failed with:
			 *
			 *     - Expected: "Position: 1"
			 *     - Received: ""
			 *
			 *     This is because the form fixture (as ported) is defined without
			 *     closing the itext item's `id` attribute. The resulting XML produced
			 *     by the fixture DSL causes that `id` attribute to be truncated,
			 *     losing its last character.
			 *
			 * - It's recommended that JavaRosa update this test, both to fully
			 *   exercise the apparently intended `jr:itext` functionality, and to
			 *   correct the fixture definition to close that itext `id` attribute.
			 *   I've verified that both changes pass as expected in JavaRosa, and
			 *   that the test fails as expected with only the `jr:itext` change
			 *   (without closing the itext `id` attribute).
			 */
			describe('[direct port/alternate - output resolves relative references in `jr:itext`]', () => {
				it.fails('resolves relative references in [`jr:itext`] itext', async () => {
					const scenario = await Scenario.init(
						'<output> with relative ref in translation',
						html(
							head(
								title('output with relative ref in translation'),
								model(
									t(
										'itext',
										t(
											'translation lang="Français"',
											t(
												'text id="/data/repeat/position_in_label:label',
												t('value', 'Position: <output value="../position"/>')
											)
										)
									),
									mainInstance(
										t(
											'data id="relative-output"',
											t('repeat jr:template=""', t('position'), t('position_in_label'))
										)
									),
									bind('/data/repeat/position').type('int').calculate('position(..)'),
									bind('/data/repeat/position_in_label').type('int')
								)
							),
							body(
								repeat(
									'/data/repeat',
									input(
										'/data/repeat/position_in_label',
										label('Position: <output value=" ../position "/>')
									)
								)
							)
						)
					);

					scenario.next('/data/repeat');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/repeat',
					});
					scenario.next('/data/repeat[1]/position_in_label');

					// FormEntryCaption caption = new FormEntryCaption(scenario.getFormDef(), scenario.getCurrentIndex());
					let caption = new JRFormEntryCaption(scenario.getFormDef(), scenario.getCurrentIndex());

					expect(caption.getQuestionText()).toBe('Position: 1');

					scenario.next('/data/repeat');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/repeat',
					});
					scenario.next('/data/repeat[2]/position_in_label');

					// caption = new FormEntryCaption(scenario.getFormDef(), scenario.getCurrentIndex());
					caption = new JRFormEntryCaption(scenario.getFormDef(), scenario.getCurrentIndex());

					expect(caption.getQuestionText()).toBe('Position: 2');
				});

				it('produces the output of an expression with a relative reference (alternate #1)', async () => {
					const scenario = await Scenario.init(
						'<output> with relative ref in translation',
						html(
							head(
								title('output with relative ref in translation'),
								model(
									t(
										'itext',
										t(
											'translation lang="Français"',
											t(
												'text id="/data/repeat/position_in_label:label',
												t('value', 'Position: <output value="../position"/>')
											)
										)
									),
									mainInstance(
										t(
											'data id="relative-output"',
											t('repeat jr:template=""', t('position'), t('position_in_label'))
										)
									),
									bind('/data/repeat/position').type('int').calculate('position(..)'),
									bind('/data/repeat/position_in_label').type('int')
								)
							),
							body(
								repeat(
									'/data/repeat',
									input(
										'/data/repeat/position_in_label',
										label('Position: <output value=" ../position "/>')
									)
								)
							)
						)
					);

					scenario.next('/data/repeat');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/repeat',
					});
					scenario.next('/data/repeat[1]/position_in_label');

					expect(
						scenario.proposed_getQuestionLabelText({
							assertCurrentReference: '/data/repeat[1]/position_in_label',
						})
					).toBe('Position: 1');

					scenario.next('/data/repeat');
					scenario.createNewRepeat({
						assertCurrentReference: '/data/repeat',
					});
					scenario.next('/data/repeat[2]/position_in_label');

					expect(
						scenario.proposed_getQuestionLabelText({
							assertCurrentReference: '/data/repeat[2]/position_in_label',
						})
					).toBe('Position: 2');
				});

				it.fails(
					'produces the output of an expression with a relative reference (alternate #2)',
					async () => {
						const scenario = await Scenario.init(
							'<output> with relative ref in translation',
							html(
								head(
									title('output with relative ref in translation'),
									model(
										t(
											'itext',
											t(
												'translation lang="Français"',
												t(
													'text id="/data/repeat/position_in_label:label"',
													t('value', 'Position: <output value="../position"/>')
												)
											)
										),
										mainInstance(
											t(
												'data id="relative-output"',
												t('repeat jr:template=""', t('position'), t('position_in_label'))
											)
										),
										bind('/data/repeat/position').type('int').calculate('position(..)'),
										bind('/data/repeat/position_in_label').type('int')
									)
								),
								body(
									repeat(
										'/data/repeat',
										input(
											'/data/repeat/position_in_label',
											labelRef("jr:itext('/data/repeat/position_in_label:label')")
										)
									)
								)
							)
						);

						scenario.next('/data/repeat');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/repeat',
						});
						scenario.next('/data/repeat[1]/position_in_label');

						expect(
							scenario.proposed_getQuestionLabelText({
								assertCurrentReference: '/data/repeat[1]/position_in_label',
							})
						).toBe('Position: 1');

						scenario.next('/data/repeat');
						scenario.createNewRepeat({
							assertCurrentReference: '/data/repeat',
						});
						scenario.next('/data/repeat[2]/position_in_label');

						expect(
							scenario.proposed_getQuestionLabelText({
								assertCurrentReference: '/data/repeat[2]/position_in_label',
							})
						).toBe('Position: 2');
					}
				);
			});
		});
	});
});
