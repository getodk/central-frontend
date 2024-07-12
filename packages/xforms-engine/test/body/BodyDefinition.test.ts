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
	repeat,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl';
import { beforeEach, describe, expect, it } from 'vitest';
import { XFormDefinition } from '../../src/XFormDefinition.ts';
import type { BodyDefinition } from '../../src/body/BodyDefinition.ts';

describe('BodyDefinition', () => {
	let bodyDefinition: BodyDefinition;

	beforeEach(() => {
		const xform = html(
			head(
				title('Body definition'),
				model(
					mainInstance(
						// prettier-ignore
						t('root id="body-definition"',

							// prettier-ignore
							t('input'),
							t('input-label-hint'),

							// prettier-ignore
							t('loggrp',
								// prettier-ignore
								t('lg-child-1'),
								t('lg-child-2')
							),

							// prettier-ignore
							t('loggrp-2',
								// prettier-ignore
								t('lg2-1'),
								t('lg2-2')
							),

							// prettier-ignore
							t('presgrp',
								// prettier-ignore
								t('pg-a'),
								t('pg-b')
							),

							t('sg-1'),
							t('sg-2'),
							t('sg-3'),
							t('sg-4'),
							t('sg-5'),

							// prettier-ignore
							t('rep1',
								t('r1-1'),
								t('r1-2')
							),

							// prettier-ignore
							t('rep2',
								t('r2-1')
							),

							// prettier-ignore
							t('unrelated-grp',
								t('rep3',
									t('r3-1')
								)
							)
						)
					),
					bind('/root/input'),
					bind('/root/input-label-hint'),
					bind('/root/loggrp'),
					bind('/root/loggrp/lg-child-1'),
					bind('/root/loggrp/lg-child-2'),
					bind('/root/loggrp-2/lg2-1'),
					bind('/root/loggrp-2/lg2-2'),
					bind('/root/presgrp/pg-a'),
					bind('/root/presgrp/pg-b'),
					bind('/root/sg-1'),
					bind('/root/sg-2'),
					bind('/root/sg-3'),
					bind('/root/sg-4'),
					bind('/root/sg-5'),
					bind('/root/rep1'),
					bind('/root/rep1/r1-1'),
					bind('/root/rep1/r1-2'),
					bind('/root/rep2/r2-1'),
					bind('/root/unrelated-grp'),
					bind('/root/unrelated-grp/rep3/r3-1')
				)
			),
			body(
				input('/root/input'),

				// prettier-ignore
				input('/root/input-label-hint',
					// prettier-ignore
					label('Label text'),
					t('hint', 'Hint text')
				),

				// prettier-ignore
				group('/root/loggrp',
					input('/root/loggrp/lg-child-1'),
					input(
						'/root/loggrp/lg-child-2',
						// prettier-ignore
						label('Logical group child 2')
					)
				),

				// prettier-ignore
				group('/root/loggrp-2',
					label('Logical group 2 with label'),

					input('/root/loggrp-2/lg2-1'),
					input('/root/loggrp-2/lg2-2')
				),

				// prettier-ignore
				t('group',
					label('Presentation group label'),

					input('/root/presgrp/pg-a'),
					input('/root/presgrp/pg-b', label('Presentation group child b'))
				),

				// prettier-ignore
				t('group',
					input('/root/sg-1'),
					input('/root/sg-2'),
					input('/root/sg-3'),
					input('/root/sg-4'),
					input('/root/sg-5')
				),

				// prettier-ignore
				group('/root/rep1',
					label('Repeat group'),

					// prettier-ignore
					repeat('/root/rep1',
						input('/root/rep1/r1-1'),

						// prettier-ignore
						input('/root/rep1/r1-2',
							label('Repeat 1 input 2'))
					)
				),

				// prettier-ignore
				repeat('/root/rep2',
					input('/root/rep2/r2-1')
				),

				// prettier-ignore
				group('/root/unrelated-grp',
					label('Group unrelated to the repeat it contains'),

					// prettier-ignore
					repeat('/root/unrelated-grp/rep3',
						input('/root/unrelated-grp/rep3/r3-1')
					)
				)
			)
		);
		const xformDefinition = new XFormDefinition(xform.asXml());

		bodyDefinition = xformDefinition.body;
	});

	describe('controls', () => {
		it('defines an input control', () => {
			const inputControl = bodyDefinition.elements[0];

			expect(inputControl).toMatchObject({
				category: 'control',
				type: 'input',
				reference: '/root/input',
				label: null,
				hint: null,
			});
		});

		it("defines an input's label", () => {
			const labeledInput = bodyDefinition.elements[1];

			expect(labeledInput).toMatchObject({
				category: 'control',
				type: 'input',
				reference: '/root/input-label-hint',
				label: {
					role: 'label',
				},
			});
		});

		it("defines an input's hint", () => {
			const hintedInput = bodyDefinition.elements[1];

			expect(hintedInput).toMatchObject({
				category: 'control',
				type: 'input',
				reference: '/root/input-label-hint',
				hint: {
					role: 'hint',
				},
			});
		});
	});

	describe('groups', () => {
		describe('logical groups', () => {
			it('defines a logical group for a <group> with a `ref`, but no <label>', () => {
				const logicalGroup = bodyDefinition.elements[2];

				expect(logicalGroup).toMatchObject({
					category: 'structure',
					type: 'logical-group',
					reference: '/root/loggrp',
					label: null,
				});
			});

			it("defines an unlabeled logical group's children", () => {
				const logicalGroup = bodyDefinition.elements[2];

				expect(logicalGroup).toMatchObject({
					children: [
						{
							category: 'control',
							type: 'input',
							reference: '/root/loggrp/lg-child-1',
							label: null,
							hint: null,
						},
						{
							category: 'control',
							type: 'input',
							reference: '/root/loggrp/lg-child-2',
							label: {
								role: 'label',
							},
							hint: null,
						},
					],
				});
			});

			it('defines a logical group for a <group> with a `ref` and a <label>', () => {
				const logicalGroup = bodyDefinition.elements[3];

				expect(logicalGroup).toMatchObject({
					category: 'structure',
					type: 'logical-group',
					reference: '/root/loggrp-2',
					label: {
						role: 'label',
					},
				});
			});

			it("defines a labeled logical group's children", () => {
				const logicalGroup = bodyDefinition.elements[3];

				expect(logicalGroup).toMatchObject({
					children: [
						{
							category: 'control',
							type: 'input',
							reference: '/root/loggrp-2/lg2-1',
							label: null,
							hint: null,
						},
						{
							category: 'control',
							type: 'input',
							reference: '/root/loggrp-2/lg2-2',
							label: null,
							hint: null,
						},
					],
				});
			});
		});

		describe('presentation groups', () => {
			it('defines a presentation group for a <group> a <label> and no `ref`', () => {
				const presentationGroup = bodyDefinition.elements[4];

				expect(presentationGroup).toMatchObject({
					category: 'structure',
					type: 'presentation-group',
					reference: null,
					label: {
						role: 'label',
					},
				});
			});

			it("defines a presentation group's children", () => {
				const presentationGroup = bodyDefinition.elements[4];

				expect(presentationGroup).toMatchObject({
					children: [
						{
							category: 'control',
							type: 'input',
							reference: '/root/presgrp/pg-a',
							label: null,
							hint: null,
						},
						{
							category: 'control',
							type: 'input',
							reference: '/root/presgrp/pg-b',
							label: {
								role: 'label',
							},
							hint: null,
						},
					],
				});
			});
		});

		describe('structural groups', () => {
			it('defines a structural group for a <group> with no `ref` or <label>', () => {
				const structuralGroup = bodyDefinition.elements[5];

				expect(structuralGroup).toMatchObject({
					category: 'structure',
					type: 'structural-group',
					reference: null,
					label: null,
				});
			});

			it("defines a structural group's children", () => {
				const structuralGroup = bodyDefinition.elements[5];

				expect(structuralGroup).toMatchObject({
					children: [
						{
							category: 'control',
							type: 'input',
							reference: '/root/sg-1',
							label: null,
							hint: null,
						},
						{
							category: 'control',
							type: 'input',
							reference: '/root/sg-2',
							label: null,
							hint: null,
						},
						{
							category: 'control',
							type: 'input',
							reference: '/root/sg-3',
							label: null,
							hint: null,
						},
						{
							category: 'control',
							type: 'input',
							reference: '/root/sg-4',
							label: null,
							hint: null,
						},
						{
							category: 'control',
							type: 'input',
							reference: '/root/sg-5',
							label: null,
							hint: null,
						},
					],
				});
			});
		});
	});

	describe('repeats', () => {
		it('defines a repeat for a <group> containing a <repeat> with the same `ref`/`nodeset`', () => {
			const repeatDefinition = bodyDefinition.elements[6];

			expect(repeatDefinition).toMatchObject({
				category: 'structure',
				type: 'repeat',
				reference: '/root/rep1',
				label: {
					role: 'label',
				},
			});
		});

		it("defines the repeat's children", () => {
			const repeatDefinition = bodyDefinition.elements[6];

			expect(repeatDefinition).toMatchObject({
				children: [
					{
						category: 'control',
						type: 'input',
						reference: '/root/rep1/r1-1',
						label: null,
					},
					{
						category: 'control',
						type: 'input',
						reference: '/root/rep1/r1-2',
						label: {
							role: 'label',
						},
					},
				],
			});
		});

		it('defines a repeat for a <repeat> without an explicit containing <group>, for API consistency', () => {
			const repeatDefinition = bodyDefinition.elements[7];

			expect(repeatDefinition).toMatchObject({
				category: 'structure',
				type: 'repeat',
				reference: '/root/rep2',
				label: null,
				children: [
					{
						category: 'control',
						type: 'input',
						reference: '/root/rep2/r2-1',
						label: null,
					},
				],
			});
		});

		it('gets repeat instance children by reference', () => {
			const control = bodyDefinition.getBodyElement('/root/rep1/r1-1');

			expect(control).toMatchObject({
				category: 'control',
				type: 'input',
				reference: '/root/rep1/r1-1',
				label: null,
			});
		});
	});
});
