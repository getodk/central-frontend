import { XFORMS_NAMESPACE_URI } from '@odk-web-forms/common/constants/xmlns.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	body,
	head,
	html,
	instance,
	mainInstance,
	model,
	t,
	title,
} from '../../test/fixtures/xform-dsl';
import type { HtmlXFormsElement } from '../../test/fixtures/xform-dsl/HtmlXFormsElement.ts';
import { XFormDOM } from './XFormDOM.ts';

describe('XFormDOM', () => {
	let xform: HtmlXFormsElement;
	let xformDOM: XFormDOM;

	beforeEach(() => {
		xform = html(
			head(
				title('Normalize repeat ref'),
				model(
					mainInstance(
						// prettier-ignore
						t('root id="bind-types"',
							t('rep',
								// prettier-ignore
								t('a'),
								t('b')
							),
							t('rep2',
								// prettier-ignore
								t('c'),
								t('d')
							),
							t('unrelated-grp',
								// prettier-ignore
								t('rep3',
									// prettier-ignore
									t('e'),
									t('f')
								)
							)
						)
					),
					instance(
						'secondary-1',
						t(
							'root',
							t(
								'item',
								// prettier-ignore
								t('val', 'value 1'),
								t('txt', 'text 1')
							)
						)
					)
				)
			),
			body(
				t(
					'group id="group-nodeset" nodeset="/root/rep" group-containing-repeat=""',
					t(
						'repeat id="repeat-ref" ref="/root/rep" repeat-contained-by-group=""',
						// prettier-ignore
						t('input id="input-nodeset" nodeset="/root/rep/a" grouped-repeat-child=""'),
						t(
							'select1 id="select-nodeset" nodeset="/root/rep/b" grouped-repeat-child=""',
							t(
								'itemset id="itemset-ref" ref="instance(&quot;secondary-1&quot;)/root/item"',
								t(`value ref="val"`),
								t(`label ref="text"`)
							)
						)
					)
				),
				t(
					'repeat id="ungrouped-repeat" nodeset="/root/rep2"',
					t('input ref="/root/rep2/c"'),
					t('input ref="/root/rep2/d"')
				),
				t(
					'group id="unrelated-group" ref="/root/unrelated-grp"',
					t(
						'repeat id="unrelated-grouped-repeat" nodeset="/root/unrelated-grp/rep3"',
						t('input ref="/root/unrelated-grp/rep3/e"'),
						t('input ref="/root/unrelated-grp/rep3/f"')
					)
				)
			)
		);
		xformDOM = XFormDOM.from(xform.asXml());
	});

	it.each([
		{
			from: '<group nodeset>',
			to: '<group ref>',
			id: 'group-nodeset',
			expected: {
				nodeset: null,
				ref: '/root/rep',
			},
		},
		{
			from: '<repeat ref>',
			to: '<repeat nodeset>',
			id: 'repeat-ref',
			expected: {
				nodeset: '/root/rep',
				ref: null,
			},
		},
		{
			from: '<input nodeset>',
			to: '<input ref>',
			id: 'input-nodeset',
			expected: {
				nodeset: null,
				ref: '/root/rep/a',
			},
		},
		{
			from: '<select nodeset>',
			to: '<select ref>',
			id: 'select-nodeset',
			expected: {
				nodeset: null,
				ref: '/root/rep/b',
			},
		},
		{
			from: '<itemset ref>',
			to: '<itemset nodeset>',
			id: 'itemset-ref',
			expected: {
				nodeset: 'instance("secondary-1")/root/item',
				ref: null,
			},
		},
	])('normalizes $from to $to', ({ id, expected }) => {
		const element = xformDOM.xformDocument.getElementById(id)!;

		expect(element.getAttribute('nodeset')).toBe(expected.nodeset);
		expect(element.getAttribute('ref')).toBe(expected.ref);
	});

	it('wraps an ungrouped <repeat> with a <group> with the same nodeset reference', () => {
		const repeat = xformDOM.xformDocument.getElementById('ungrouped-repeat')!;
		const parent = repeat.parentElement!;

		expect(parent.namespaceURI).toBe(XFORMS_NAMESPACE_URI);
		expect(parent.localName).toBe('group');
		expect(parent.getAttribute('ref')).toBe(repeat.getAttribute('nodeset'));
	});

	it('wraps a <repeat> within a <group> referencing a different nodeset into a new <group> with its own nodeset reference', () => {
		const unrelatedGroup = xformDOM.xformDocument.getElementById('unrelated-group')!;
		const repeat = xformDOM.xformDocument.getElementById('unrelated-grouped-repeat')!;
		const parent = repeat.parentElement!;

		expect(parent.namespaceURI).toBe(XFORMS_NAMESPACE_URI);
		expect(parent.localName).toBe('group');
		expect(parent.getAttribute('ref')).toBe(repeat.getAttribute('nodeset'));
		expect(parent.parentElement).toBe(unrelatedGroup);
	});
});
