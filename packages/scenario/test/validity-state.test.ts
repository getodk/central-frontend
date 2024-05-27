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
			it.fails('[is] are always satisfied', async () => {
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
			it.fails('make[s] form validation fail', async () => {
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
			it.fails('[has no clear BDD-ish description equivalent]', async () => {
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
