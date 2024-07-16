import type { HtmlXFormsElement } from '@getodk/common/test/fixtures/xform-dsl/HtmlXFormsElement.ts';
import {
	bind,
	body,
	group,
	head,
	html,
	input,
	item,
	label,
	mainInstance,
	model,
	select1,
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
							t('colors-outer',
								t('colors-inner',
									t('color')),
								t('other-color')),
							t('meta',
								t('instanceID')))),
						bind('/data/contactdetails/residentialAddress').required(),
						bind('/data/contactdetails/phone/home').required(),
						bind('/data/colors-outer/colors-inner/color').required(),
						bind('/data/colors-outer/other-color').required())
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
							label('Home phone no.')))),

				group('/data/colors-outer',
					label('Colors: outer'),

					group('/data/colors-outer/colors-inner',
						label('Colors: inner'),

						select1('/data/colors-outer/colors-inner/color',
							label('Color'),
							item('red', 'Red'),
							item('green', 'Green'))),

					select1('/data/colors-outer/other-color',
						label('Other color'),
						item('purple', 'Purple'),
						item('mauve', 'Mauve')))));
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
		it('observes violations of a direct string input child', async () => {
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

		it('observes violations of a direct select child', async () => {
			const observed = await reactiveTestScope(async ({ effect, mutable }) => {
				const root = await initializeForm(definition.asXml(), {
					config: {
						stateFactory: mutable,
					},
				});

				const colorsOuter = root.currentState.children[1];

				if (
					colorsOuter?.nodeType !== 'group' ||
					colorsOuter.currentState.reference !== '/data/colors-outer'
				) {
					throw new Error('Expected group /data/colors-outer');
				}

				const colorsInner = colorsOuter.currentState.children[0];

				if (
					colorsInner?.nodeType !== 'group' ||
					colorsInner.currentState.reference !== '/data/colors-outer/colors-inner'
				) {
					throw new Error('Expected group /data/colors-outer/colors-inner');
				}

				const observedViolations: ObservedViolationReferences = [];

				effect(() => {
					observedViolations.push(
						colorsInner.validationState.violations.map((violationReference) => {
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
						reference: '/data/colors-outer/colors-inner/color',
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

	describe('direct children', () => {
		it('reactively updates when a direct string input child becomes valid', async () => {
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

		it('reactively updates when a direct select child becomes valid', async () => {
			const observed = await reactiveTestScope(async ({ effect, mutable }) => {
				const root = await initializeForm(definition.asXml(), {
					config: {
						stateFactory: mutable,
					},
				});

				const colorsOuter = root.currentState.children[1];

				if (
					colorsOuter?.nodeType !== 'group' ||
					colorsOuter.currentState.reference !== '/data/colors-outer'
				) {
					throw new Error('Expected group /data/colors-outer');
				}

				const colorsInner = colorsOuter.currentState.children[0];

				if (
					colorsInner?.nodeType !== 'group' ||
					colorsInner.currentState.reference !== '/data/colors-outer/colors-inner'
				) {
					throw new Error('Expected group /data/colors-outer/colors-inner');
				}

				const observedViolations: ObservedViolationReferences = [];

				effect(() => {
					observedViolations.push(
						colorsInner.validationState.violations.map((violationReference) => {
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

				const color = colorsInner.currentState.children[0];

				if (
					color?.nodeType !== 'select' ||
					color.currentState.reference !== '/data/colors-outer/colors-inner/color'
				) {
					throw new Error('Expected select /data/colors-outer/colors-inner/color');
				}

				const [option] = color.currentState.valueOptions;

				if (option == null) {
					throw new Error('Cannot set value of select, no options available');
				}

				// Satisfy `required` condition
				color.select(option);

				return observedViolations;
			});

			expect(observed).toEqual([
				// Initially invalid
				[
					{
						reference: '/data/colors-outer/colors-inner/color',
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
	});

	describe('deeper descendants', () => {
		it('reactively updates when a deeper string input descendant becomes valid', async () => {
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

		it('reactively updates when a deeper select descendant becomes valid', async () => {
			const observed = await reactiveTestScope(async ({ effect, mutable }) => {
				const root = await initializeForm(definition.asXml(), {
					config: {
						stateFactory: mutable,
					},
				});

				const colorsOuter = root.currentState.children[1];

				if (
					colorsOuter?.nodeType !== 'group' ||
					colorsOuter.currentState.reference !== '/data/colors-outer'
				) {
					throw new Error('Expected group /data/colors-outer');
				}

				const observedViolations: ObservedViolationReferences = [];

				effect(() => {
					observedViolations.push(
						colorsOuter.validationState.violations.map((violationReference) => {
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

				const colorsInner = colorsOuter.currentState.children[0];

				if (
					colorsInner?.nodeType !== 'group' ||
					colorsInner.currentState.reference !== '/data/colors-outer/colors-inner'
				) {
					throw new Error('Expected group /data/colors-outer/colors-inner');
				}

				const color = colorsInner.currentState.children[0];

				if (
					color?.nodeType !== 'select' ||
					color.currentState.reference !== '/data/colors-outer/colors-inner/color'
				) {
					throw new Error('Expected select /data/colors-outer/colors-inner/color');
				}

				const [option] = color.currentState.valueOptions;

				if (option == null) {
					throw new Error('Cannot set value of select, no options available');
				}

				// Satisfy `required` condition
				color.select(option);

				return observedViolations;
			});

			expect(observed).toEqual([
				// Both descendants initially invalid
				[
					{
						reference: '/data/colors-outer/colors-inner/color',
						violation: {
							condition: 'required',
							valid: false,
							message: VALIDATION_TEXT.requiredMsg,
						},
					},
					{
						reference: '/data/colors-outer/other-color',
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
						reference: '/data/colors-outer/other-color',
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
});
