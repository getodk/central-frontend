import type { HtmlXFormsElement } from '@getodk/common/test/fixtures/xform-dsl/HtmlXFormsElement.ts';
import {
	bind,
	body,
	group,
	head,
	html,
	input,
	label,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { VALIDATION_TEXT } from '../../../src/client/constants.ts';
import { initializeForm, type ValidationCondition } from '../../../src/index.ts';
import { reactiveTestScope } from '../../helpers/reactive/internal.ts';

describe('createAggregatedViolations - reactive aggregated `constraint` and `required` validation violations on ancestor nodes', () => {
	let definition: HtmlXFormsElement;

	beforeEach(() => {
		// Reduced from https://github.com/sadiqkhoja/web-forms/blob/5e678e133584555990c6a19aeecc59561610f6c9/packages/ui-solid/fixtures/xforms/validation/1-validation.xml
		// prettier-ignore
		definition = html(
			head(
				title('Validation Form'),
				model(
					mainInstance(
						t('data id="validation"',
							t('contactdetails',
								t('residentialAddress'),
								t('phone',
										t('home'))),
							t('meta',
								t('instanceID')))),
					bind('/data/contactdetails/residentialAddress').required(),
					bind('/data/contactdetails/phone/home').required())
			),
			body(
				group(
					'/data/contactdetails',
					label('Household'),

					input("/data/contactdetails/residentialAddress",
						label('Residential address')),

					group("/data/contactdetails/phone",
						label('Phone numbers'),

						input('/data/contactdetails/phone/home',
							label('Home phone no.'))))));
	});

	interface SimplifiedViolation {
		readonly condition: ValidationCondition;
		readonly valid: false;
		readonly message: string;
	}

	interface SimplifiedViolationReference {
		readonly reference: string;
		readonly violation: SimplifiedViolation;
	}

	// prettier-ignore
	type ObservedViolationReferences = Array<
		readonly SimplifiedViolationReference[]
	>;

	describe('check assumptions: ensure observing violation state is effective', () => {
		it('observes violations of direct children', async () => {
			const observed = await reactiveTestScope(async ({ effect, mutable }) => {
				const root = await initializeForm(definition.asXml(), {
					config: {
						stateFactory: mutable,
					},
				});

				const contactDetails = root.currentState.children[0];

				if (
					contactDetails?.nodeType !== 'group' ||
					contactDetails.currentState.reference !== '/data/contactdetails'
				) {
					throw new Error('Expected group /data/contactdetails');
				}

				const phone = contactDetails.currentState.children[1];

				if (
					phone?.nodeType !== 'group' ||
					phone.currentState.reference !== '/data/contactdetails/phone'
				) {
					throw new Error('Expected group /data/contactdetails/phone');
				}

				const observedViolations: ObservedViolationReferences = [];

				effect(() => {
					observedViolations.push(
						phone.validationState.violations.map((violationReference) => {
							const violation: SimplifiedViolation = {
								condition: violationReference.violation.condition,
								valid: violationReference.violation.valid,
								message: violationReference.violation.message.asString,
							};

							return {
								reference: violationReference.reference,
								violation,
							};
						})
					);
				});

				return observedViolations;
			});

			expect(observed).toEqual([
				// Initially invalid
				[
					{
						reference: '/data/contactdetails/phone/home',
						violation: {
							condition: 'required',
							valid: false,
							message: VALIDATION_TEXT.requiredMsg,
						},
					},
				],
			]);
		});
	});

	it('reactively updates when a direct child becomes valid', async () => {
		const observed = await reactiveTestScope(async ({ effect, mutable }) => {
			const root = await initializeForm(definition.asXml(), {
				config: {
					stateFactory: mutable,
				},
			});

			const contactDetails = root.currentState.children[0];

			if (
				contactDetails?.nodeType !== 'group' ||
				contactDetails.currentState.reference !== '/data/contactdetails'
			) {
				throw new Error('Expected group /data/contactdetails');
			}

			const phone = contactDetails.currentState.children[1];

			if (
				phone?.nodeType !== 'group' ||
				phone.currentState.reference !== '/data/contactdetails/phone'
			) {
				throw new Error('Expected group /data/contactdetails/phone');
			}

			const observedViolations: ObservedViolationReferences = [];

			effect(() => {
				observedViolations.push(
					phone.validationState.violations.map((violationReference) => {
						const violation: SimplifiedViolation = {
							condition: violationReference.violation.condition,
							valid: violationReference.violation.valid,
							message: violationReference.violation.message.asString,
						};

						return {
							reference: violationReference.reference,
							violation,
						};
					})
				);
			});

			const home = phone.currentState.children[0];

			if (
				home?.currentState.reference !== '/data/contactdetails/phone/home' ||
				home.nodeType !== 'string'
			) {
				throw new Error('Expected string node /data/contactdetails/phone/home');
			}

			// Satisfy `required` condition
			home.setValue('555-867-5309');

			return observedViolations;
		});

		expect(observed).toEqual([
			// Initially invalid
			[
				{
					reference: '/data/contactdetails/phone/home',
					violation: {
						condition: 'required',
						valid: false,
						message: VALIDATION_TEXT.requiredMsg,
					},
				},
			],

			// Valid after change
			[],
		]);
	});

	it('reactively updates when a deeper descendant becomes valid', async () => {
		const observed = await reactiveTestScope(async ({ effect, mutable }) => {
			const root = await initializeForm(definition.asXml(), {
				config: {
					stateFactory: mutable,
				},
			});

			const contactDetails = root.currentState.children[0];

			if (
				contactDetails?.nodeType !== 'group' ||
				contactDetails.currentState.reference !== '/data/contactdetails'
			) {
				throw new Error('Expected group /data/contactdetails');
			}

			const observedViolations: ObservedViolationReferences = [];

			effect(() => {
				observedViolations.push(
					contactDetails.validationState.violations.map((violationReference) => {
						const violation: SimplifiedViolation = {
							condition: violationReference.violation.condition,
							valid: violationReference.violation.valid,
							message: violationReference.violation.message.asString,
						};

						return {
							reference: violationReference.reference,
							violation,
						};
					})
				);
			});

			const phone = contactDetails.currentState.children[1];

			if (
				phone?.nodeType !== 'group' ||
				phone.currentState.reference !== '/data/contactdetails/phone'
			) {
				throw new Error('Expected group /data/contactdetails/phone');
			}

			const home = phone.currentState.children[0];

			if (
				home?.currentState.reference !== '/data/contactdetails/phone/home' ||
				home.nodeType !== 'string'
			) {
				throw new Error('Expected string node /data/contactdetails/phone/home');
			}

			// Satisfy `required` condition
			home.setValue('555-867-5309');

			return observedViolations;
		});

		expect(observed).toEqual([
			// Both descendants initially invalid
			[
				{
					reference: '/data/contactdetails/residentialAddress',
					violation: {
						condition: 'required',
						valid: false,
						message: VALIDATION_TEXT.requiredMsg,
					},
				},
				{
					reference: '/data/contactdetails/phone/home',
					violation: {
						condition: 'required',
						valid: false,
						message: VALIDATION_TEXT.requiredMsg,
					},
				},
			],

			// Direct child still invalid; deeper descendant valid after change
			[
				{
					reference: '/data/contactdetails/residentialAddress',
					violation: {
						condition: 'required',
						valid: false,
						message: VALIDATION_TEXT.requiredMsg,
					},
				},
			],
		]);
	});
});
