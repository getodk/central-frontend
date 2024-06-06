import { XHTML_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { HtmlXFormsElement } from '@getodk/common/test/fixtures/xform-dsl/HtmlXFormsElement.ts';
import {
	body,
	head,
	html,
	instance,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { XFormDOM } from '../src/XFormDOM.ts';

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
						  t('grp',
								// prettier-ignore
								t('g1')
							),
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
					'group id="group-nodeset" nodeset="/root/grp"',
					// prettier-ignore
					t('input id="input-nodeset" nodeset="/root/grp/g1"')
				),
				t(
					'group id="repeat-group" nodeset="/root/rep" group-containing-repeat=""',
					t(
						'repeat id="repeat-ref" ref="/root/rep" repeat-contained-by-group=""',
						// prettier-ignore
						t('input nodeset="/root/rep/a" grouped-repeat-child=""'),
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
				ref: '/root/grp',
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
				ref: '/root/grp/g1',
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

	it('unwraps a <group ref><repeat nodeset> pair', () => {
		const repeatElement = xformDOM.xformDocument.getElementById('repeat-ref')!;

		expect(repeatElement).not.toBeNull();

		const parent = repeatElement.parentElement!;

		expect(parent.namespaceURI).toBe(XHTML_NAMESPACE_URI);
		expect(parent.localName).toBe('body');

		const repeatGroup = xformDOM.xformDocument.getElementById('repeat-group');

		expect(repeatGroup).toBeNull();
	});

	it('does not unwrap an ungrouped <repeat> with a <group> with the same nodeset reference', () => {
		const repeat = xformDOM.xformDocument.getElementById('ungrouped-repeat')!;
		const parent = repeat.parentElement!;

		expect(parent.namespaceURI).toBe(XHTML_NAMESPACE_URI);
		expect(parent.localName).toBe('body');
	});

	it('normalizes a <repeat ref> to use a `nodeset` attribute', () => {
		const repeat = xformDOM.xformDocument.getElementById('repeat-ref')!;

		expect(repeat.getAttribute('ref')).toBeNull();
		expect(repeat.getAttribute('nodeset')).toBe('/root/rep');
	});

	it('does not unwrap a <repeat> within a <group> referencing a different nodeset', () => {
		const unrelatedGroup = xformDOM.xformDocument.getElementById('unrelated-group')!;
		const repeat = xformDOM.xformDocument.getElementById('unrelated-grouped-repeat')!;

		expect(repeat.parentElement).toBe(unrelatedGroup);
	});
});
