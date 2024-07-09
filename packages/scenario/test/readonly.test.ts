import {
	bind,
	body,
	group,
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

describe('TriggerableDagTest.java', () => {
	interface CastReadonlyExpressionOptions {
		readonly castReadonlyExpressionsAsNumber: boolean;
	}

	/**
	 * **PORTING NOTES**
	 *
	 * This test has the same semantic considerations (XPath node-set -> boolean
	 * casting, potential considerations for value casting on writes, etc) as the
	 * ported relevance test of a similar name/approach.
	 *
	 * The test has been parameterized to demonstrate this concisely, with the
	 * second run wrapping the `readonly` expressions in a `number()` cast (which
	 * passes as expected).
	 *
	 * JR:
	 *
	 * Read-only is inherited from ancestor nodes, as per the W3C XForms specs:
	 * - https://www.w3.org/TR/xforms11/#model-prop-relevant
	 */
	describe.each<CastReadonlyExpressionOptions>([
		{ castReadonlyExpressionsAsNumber: false },
		{ castReadonlyExpressionsAsNumber: true },
	])(
		'readonly (cast readonly expression as number: $castReadonlyExpressionAsNumber)',
		({ castReadonlyExpressionsAsNumber }) => {
			let testFn: typeof it | typeof it.fails;

			if (castReadonlyExpressionsAsNumber) {
				testFn = it;
			} else {
				testFn = it.fails;
			}

			let castReadonlyExpression: (baseExpression: string) => string;

			if (castReadonlyExpressionsAsNumber) {
				castReadonlyExpression = (baseExpression) => `number(${baseExpression})`;
			} else {
				castReadonlyExpression = (baseExpression) => baseExpression;
			}

			testFn('is inherited from ancestors', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(
									t(
										'data id="some-form"',
										t('is-outer-readonly'),
										t('is-inner-readonly'),
										t('is-field-readonly'),
										t('outer', t('inner', t('field')))
									)
								),
								bind('/data/is-outer-readonly').type('boolean'),
								bind('/data/is-inner-readonly').type('boolean'),
								bind('/data/is-field-readonly').type('boolean'),
								bind('/data/outer').readonly(castReadonlyExpression('/data/is-outer-readonly')),
								bind('/data/outer/inner').readonly(
									castReadonlyExpression('/data/is-inner-readonly')
								),
								bind('/data/outer/inner/field')
									.type('string')
									.readonly(castReadonlyExpression('/data/is-field-readonly'))
							)
						),
						body(
							input('/data/is-outer-readonly'),
							input('/data/is-inner-readonly'),
							input('/data/is-field-readonly'),
							group('/data/outer', group('/data/outer/inner', input('/data/outer/inner/field')))
						)
					)
				);

				// Form initialization evaluates all triggerables, which makes the field editable (not read-only)
				expect(scenario.getInstanceNode('/data/outer')).toBeEnabled();
				expect(scenario.getInstanceNode('/data/outer/inner')).toBeEnabled();
				expect(scenario.getInstanceNode('/data/outer/inner/field')).toBeEnabled();

				// Make the outer group read-only
				scenario.answer('/data/is-outer-readonly', true);

				expect(scenario.getInstanceNode('/data/outer')).toBeReadonly();
				expect(scenario.getInstanceNode('/data/outer/inner')).toBeReadonly();
				expect(scenario.getInstanceNode('/data/outer/inner/field')).toBeReadonly();

				// Make the inner group read-only
				scenario.answer('/data/is-outer-readonly', false);
				scenario.answer('/data/is-inner-readonly', true);

				expect(scenario.getInstanceNode('/data/outer')).toBeEnabled();
				expect(scenario.getInstanceNode('/data/outer/inner')).toBeReadonly();
				expect(scenario.getInstanceNode('/data/outer/inner/field')).toBeReadonly();

				// Make the field read-only
				scenario.answer('/data/is-inner-readonly', false);
				scenario.answer('/data/is-field-readonly', true);

				expect(scenario.getInstanceNode('/data/outer')).toBeEnabled();
				expect(scenario.getInstanceNode('/data/outer/inner')).toBeEnabled();
				expect(scenario.getInstanceNode('/data/outer/inner/field')).toBeReadonly();
			});
		}
	);
});
