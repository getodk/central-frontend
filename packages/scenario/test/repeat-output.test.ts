import {
	bind,
	body,
	head,
	html,
	input,
	label,
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
		});
	});
});
