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
	it('is inherited from ancestors', async () => {
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
						bind('/data/outer').readonly('/data/is-outer-readonly'),
						bind('/data/outer/inner').readonly('/data/is-inner-readonly'),
						bind('/data/outer/inner/field').type('string').readonly('/data/is-field-readonly')
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
});
