import { beforeEach, describe, expect, it } from 'vitest';
import {
	bind,
	body,
	head,
	html,
	input,
	label,
	mainInstance,
	model,
	t,
	title,
} from '../../test/fixtures/xform-dsl';
import { XFormDefinition } from './XFormDefinition.ts';
import { XFormViewDefinition } from './XFormViewDefinition.ts';

describe('XFormViewDefinition', () => {
	let xformViewDefinition: XFormViewDefinition;

	beforeEach(() => {
		const xform = html(
			head(
				title('View definition'),
				model(
					mainInstance(
						t(
							`root id="view-definition"`,
							t('first-question'),
							t('second-question'),
							t('third-question'),
							t('meta', t('instanceID'))
						)
					),
					bind('/root/first-question').type('string'),
					bind('/root/second-question').type('string'),
					bind('/root/third-question').type('string'),
					bind('/root/meta/instanceID').type('string')
				)
			),
			body(
				input('/root/first-question', label('First question')),
				input('/root/second-question'),
				t('unknown-control ref="/root/third-question"')
			)
		);

		const xformDefinition = new XFormDefinition(xform.asXml());

		xformViewDefinition = xformDefinition.view;
	});

	it("defines each of the form's view children", () => {
		expect(xformViewDefinition.children.length).toBe(3);
	});

	it.each([
		{ index: 0, type: 'input' },
		{ index: 1, type: 'input' },
		{ index: 2, type: 'UNSUPPORTED' },
	])('defines the type of child at index $index to $type)', ({ index, type }) => {
		const child = xformViewDefinition.children[index]!;

		expect(child.type).toBe(type);
	});

	it.each([
		{ index: 0, ref: '/root/first-question' },
		{ index: 1, ref: '/root/second-question' },
		{ index: 2, ref: '/root/third-question' },
	])('defines the ref of child at index $index to $ref', ({ index, ref }) => {
		const child = xformViewDefinition.children[index]!;

		expect(child.ref).toBe(ref);
	});

	it.each([
		{ index: 0, label: { parts: [{ expression: null, textContent: 'First question' }] } },
		{ index: 1, label: null },
		{ index: 2, label: null },
	])('defines the label of child at index $index to $label', ({ index, label }) => {
		const child = xformViewDefinition.children[index]!;

		expect(child.label).toEqual(label);
	});
});
