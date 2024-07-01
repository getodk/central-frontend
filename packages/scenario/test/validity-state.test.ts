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
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';
import { AnswerResult, Scenario } from '../src/jr/Scenario.ts';
import { r } from '../src/jr/resource/ResourcePathHelper.ts';
import {
	ANSWER_CONSTRAINT_VIOLATED,
	ANSWER_REQUIRED_BUT_EMPTY,
} from '../src/jr/validation/ValidateOutcome.ts';

/**
 * **PORTING NOTES**
 *
 * It's unclear if we should want `required` and `constraint` to be organized
 * together. They're conceptually similar to a user, but have a variety of
 * different semantic considerations both for testable surface area and in terms
 * of effect on client-facing APIs.
 *
 * Insofar as the organization does make some sense, it's currently inherited
 * here from JavaRosa. We may also discuss whether the "bag"/"vat"/module name
 * is less vague than desired, given there are two named expressions we could
 * more directly reference. But the current name was chosen to describe the
 * overarching concern addressed by organizing both concepts together.
 */
describe('TriggerableDagTest.java', () => {
	describe('//region Required and constraint', () => {
		describe('constraints of fields that are empty', () => {
			it('[is] are always satisfied', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('a'), t('b'))),
								bind('/data/a').type('string').constraint('/data/b'),
								bind('/data/b').type('boolean')
							)
						),
						body(input('/data/a'), input('/data/b'))
					)
				);

				// Ensure that the constraint expression in /data/a won't be satisfied
				scenario.answer('/data/b', false);

				// Verify that regardless of the constraint defined in /data/a, the
				// form appears to be valid
				expect(scenario.getFormDef()).toBeValid();
			});
		});

		describe('empty required fields', () => {
			it('make[s] form validation fail', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('a'), t('b'))),
								bind('/data/a').type('string').required(),
								bind('/data/b').type('boolean')
							)
						),
						body(input('/data/a'), input('/data/b'))
					)
				);

				const validate = scenario.getValidationOutcome();

				expect(validate.failedPrompt).toBe(scenario.indexOf('/data/a'));
				expect(validate.outcome).toBe(ANSWER_REQUIRED_BUT_EMPTY);
			});
		});

		describe('constraint violations and form finalization', () => {
			it('[has no clear BDD-ish description equivalent]', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('a'), t('b'))),
								bind('/data/a').type('string').constraint('/data/b'),
								bind('/data/b').type('boolean')
							)
						),
						body(input('/data/a'), input('/data/b'))
					)
				);

				// First, ensure we will be able to commit an answer in /data/a by
				// making it match its constraint. No values can be committed to the
				// instance if constraints aren't satisfied.
				scenario.answer('/data/b', true);

				// Then, commit an answer (answers with empty values are always valid)
				scenario.answer('/data/a', 'cocotero');

				// Then, make the constraint defined at /data/a impossible to satisfy
				scenario.answer('/data/b', false);

				// At this point, the form has /data/a filled with an answer that's
				// invalid according to its constraint expression, but we can't be
				// aware of that, unless we validate the whole form.
				//
				// Clients like Collect will validate the whole form before marking
				// a submission as complete and saving it to the filesystem.
				//
				// FormDef.validate(boolean) will go through all the relevant fields
				// re-answering them with their current values in order to detect
				// any constraint violations. When this happens, a non-null
				// ValidationOutcome object is returned including information about
				// the violated constraint.
				const validate = scenario.getValidationOutcome();

				expect(validate.failedPrompt).toBe(scenario.indexOf('/data/a'));
				expect(validate.outcome).toBe(ANSWER_CONSTRAINT_VIOLATED);
			});
		});
	});
});

/**
 * **PORTING NOTES**
 *
 * Any bare references in JavaRosa to any {@link AnswerResult} enum value are
 * referenced here to the enum members (i.e. `AnswerResult.OK`, etc.) because
 * TypeScript treats enums as nominal types (as in their plain string values are
 * not assignable to the enum type).
 */
describe('`constraint`', () => {
	describe('FormDefTest.java', () => {
		interface PrimaryInstanceIdOptions {
			readonly temporarilyIncludePrimaryInstanceId: boolean;
		}

		/**
		 * **PORTING NOTES**
		 *
		 * Fails on form init, as the primary instance does not have an `id`
		 * attribute. Parameterized to demonstrate test is now passing otherwise.
		 */
		describe.each<PrimaryInstanceIdOptions>([
			{ temporarilyIncludePrimaryInstanceId: false },
			{ temporarilyIncludePrimaryInstanceId: true },
		])(
			'temporarily include primary instance id: $temporarilyIncludePrimaryInstanceId',
			({ temporarilyIncludePrimaryInstanceId }) => {
				let testFn: typeof it | typeof it.fails;

				if (temporarilyIncludePrimaryInstanceId) {
					testFn = it;
				} else {
					testFn = it.fails;
				}

				testFn('enforces `constraint`s defined [on] in a field', async () => {
					const scenario = await Scenario.init(
						r(
							temporarilyIncludePrimaryInstanceId
								? 'ImageSelectTester-alt.xml'
								: 'ImageSelectTester.xml'
						)
					);

					scenario.next('/icons/id');
					scenario.next('/icons/name');
					scenario.next('/icons/find-mirc');
					scenario.next('/icons/non-local');
					scenario.next('/icons/consTest');

					expect(scenario.answer('10')).toHaveValidityStatus(AnswerResult.CONSTRAINT_VIOLATED);
					expect(scenario.answer('13')).toHaveValidityStatus(AnswerResult.OK);
				});
			}
		);
	});

	/**
	 * **PORTING NOTES**
	 *
	 * - JavaRosa currently returns an `AnswerResult` from
	 *   {@link Scenario.answer}, which is perfectly reasonable.
	 *
	 * - ~~We currently return a string (at runtime), but the method's return type
	 *   is currently `unknown`—intentionally deferring that aspect of the
	 *   interface in anticipation of cases like this test. It seems really likely
	 *   that the several assertion extensions (and their underlying abstractions)
	 *   introduced while porting the bulk of JavaRosa's tests would point towards
	 *   that method returning a {@link ComparableAnswer}. This would also be an
	 *   obvious place to support our introduction of the
	 *   {@link expect.toHaveValidityStatus} assertion extension, and allow quite
	 *   a few other assertions to reference the {@link Scenario.answer} return
	 *   value the same way they reference the {@link Scenario.answerOf} return
	 *   value.~~
	 *
	 * - The above point is preserved for posterity, to reflect thinking
	 *   **before** completely porting this test. {@link Scenario.answer} now
	 *   returns a {@link ComparableAnswer} because it's clearly the appropriate
	 *   mechanism for the assertion as-ported. (It still has an `unknown` return
	 *   type, which we can make more specific if we agree to introduce such a
	 *   substantial difference in the {@link Scenario} API.)
	 *
	 * - Test exercises (de)serialization (which we do not support), as well as
	 *   validation. The former is the nature of failure as ported. An alternate
	 *   test has been added below demonstrating that validation otherwise works
	 *   as expected.
	 */
	it.fails('enforces `constraint`s when [an] instance is deserialized', async () => {
		const formDef = html(
			head(
				title('Some form'),
				model(
					mainInstance(t('data id="some-form"', t('a'))),
					bind('/data/a').type('string').constraint("regex(.,'[0-9]{10}')")
				)
			),
			body(input('/data/a'))
		);

		const scenario = await Scenario.init('Some form', formDef);

		scenario.next('/data/a');

		let result = scenario.answer('00000');

		expect(result).toHaveValidityStatus(AnswerResult.CONSTRAINT_VIOLATED);

		scenario.answer('0000000000');

		scenario.next('END_OF_FORM');

		expect(scenario.getCurrentIndex().isEndOfFormIndex()).toBe(true);

		const restored = await scenario.serializeAndDeserializeInstance(formDef);

		restored.next('/data/a');

		expect(restored.answerOf('/data/a')).toEqualAnswer(stringAnswer('0000000000'));

		result = restored.answer('00000');

		expect(result).toHaveValidityStatus(AnswerResult.CONSTRAINT_VIOLATED);
	});

	it('enforces an arbitrary regex `constraint` expression (alternate to test above)', async () => {
		const formDef = html(
			head(
				title('Some form'),
				model(
					mainInstance(t('data id="some-form"', t('a'))),
					bind('/data/a').type('string').constraint("regex(.,'[0-9]{10}')")
				)
			),
			body(input('/data/a'))
		);

		const scenario = await Scenario.init('Some form', formDef);

		scenario.next('/data/a');

		let result = scenario.answer('00000');

		expect(result).toHaveValidityStatus(AnswerResult.CONSTRAINT_VIOLATED);

		result = scenario.answer('0000000000');

		expect(result).toHaveValidityStatus(AnswerResult.OK);

		result = scenario.answer('00000');

		expect(result).toHaveValidityStatus(AnswerResult.CONSTRAINT_VIOLATED);
	});
});
