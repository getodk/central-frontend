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
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { BindDefinition } from '../../../src/parse/model/BindDefinition.ts';
import type { LeafNodeDefinition } from '../../../src/parse/model/LeafNodeDefinition.ts';
import { ModelDefinition } from '../../../src/parse/model/ModelDefinition.ts';
import { XFormDefinition } from '../../../src/parse/XFormDefinition.ts';
import { XFormDOM } from '../../../src/parse/XFormDOM.ts';

describe('ModelDefinition', () => {
	let modelDefinition: ModelDefinition;

	beforeEach(() => {
		const xform = html(
			head(
				title('Model definition'),
				model(
					mainInstance(
						t(
							`root id="model-definition"`,
							t('first-question'),
							t('second-question'),
							t('third-question'),
							// prettier-ignore
							t('orx:meta',
								t('orx:instanceID'))
						)
					),
					bind('/root/first-question').type('string'),
					bind('/root/second-question').type('string'),
					bind('/root/third-question').type('string'),
					bind('/root/orx:meta/orx:instanceID').preload('uid')
				)
			),
			// prettier-ignore
			body(
				input('/root/first-question', label('First question')),
				input('/root/second-question')
			)
		);

		const xformDOM = XFormDOM.from(xform.asXml());
		const xformDefinition = new XFormDefinition(xformDOM);

		modelDefinition = xformDefinition.model;
	});

	it.each([
		{ nodeset: '/root/first-question' },
		{ nodeset: '/root/second-question' },
		{ nodeset: '/root/third-question' },
	])('defines model bindings for $nodeset', ({ nodeset }) => {
		const bindDefinition = modelDefinition.binds.get(nodeset);

		expect(bindDefinition).toBeInstanceOf(BindDefinition);
	});

	it('defines a tree representation of the model', () => {
		const { root } = modelDefinition;

		expect(root).toMatchObject({
			type: 'root',
			bind: {
				nodeset: '/root',
			},
			children: [
				{
					type: 'leaf-node',
					bind: {
						nodeset: '/root/first-question',
					},
					children: null,
				},
				{
					type: 'leaf-node',
					bind: {
						nodeset: '/root/second-question',
					},
					children: null,
				},
				{
					type: 'leaf-node',
					bind: {
						nodeset: '/root/third-question',
					},
					children: null,
				},
				{
					type: 'subtree',
					bind: {
						nodeset: '/root/orx:meta',
					},
					children: [
						{
							type: 'leaf-node',
							bind: {
								nodeset: '/root/orx:meta/orx:instanceID',
							},
							children: null,
						},
					],
				},
			],
		});
	});

	it.each([
		{
			index: 0,
			expected: {
				type: 'input',
				label: {
					role: 'label',
				},
			},
		},
		{
			index: 1,
			expected: { type: 'input', label: null },
		},
		{
			index: 2,
			expected: null,
		},
	])('includes a reference to the $index body element definition', ({ index, expected }) => {
		const child = modelDefinition.root.children[index] as LeafNodeDefinition;

		if (expected == null) {
			expect(child.bodyElement).toBeNull();
		} else {
			expect(child.bodyElement).toMatchObject(expected);
		}
	});

	describe('subtrees (groups and non-groups)', () => {
		beforeEach(() => {
			const xform = html(
				head(
					title('Model definition'),
					model(
						mainInstance(
							t(
								`root id="model-definition"`,
								// prettier-ignore
								t('grp',
									t('first'),
									t('second')
								),
								// prettier-ignore
								t('sub',
									t('third'),
									t('fourth')
								)
							)
						),
						bind('/root/grp/first').type('string'),
						bind('/root/grp/second').type('string'),
						bind('/root/sub/third').type('string'),
						bind('/root/sub/fourth').type('string')
					)
				),
				// prettier-ignore
				body(
					group('/root/grp',
						input('/root/grp/first'),
						input('/root/grp/second')
					),
					input('/root/sub/third'),
					input('/root/sub/fourth')
				)
			);

			const xformDOM = XFormDOM.from(xform.asXml());
			const xformDefinition = new XFormDefinition(xformDOM);

			modelDefinition = xformDefinition.model;
		});

		it('defines a model subtree corresponding to a group', () => {
			expect(modelDefinition.root).toMatchObject({
				type: 'root',
				bind: { nodeset: '/root' },
				bodyElement: null,
				// Note: here and other cases, object with numeric keys allows
				// checking just the specific index of the array.
				children: {
					0: {
						type: 'subtree',
						bind: { nodeset: '/root/grp' },
						bodyElement: {
							type: 'logical-group',
						},
						children: [
							{
								type: 'leaf-node',
								bind: { nodeset: '/root/grp/first' },
								bodyElement: { type: 'input' },
							},
							{
								type: 'leaf-node',
								bind: { nodeset: '/root/grp/second' },
								bodyElement: { type: 'input' },
							},
						],
					},
				},
			});
		});

		it('defines a model subtree which does not correspond to a group', () => {
			expect(modelDefinition.root).toMatchObject({
				type: 'root',
				bind: { nodeset: '/root' },
				bodyElement: null,
				children: {
					1: {
						type: 'subtree',
						bind: { nodeset: '/root/sub' },
						bodyElement: null,
						children: [
							{
								type: 'leaf-node',
								bind: { nodeset: '/root/sub/third' },
								bodyElement: { type: 'input' },
							},
							{
								type: 'leaf-node',
								bind: { nodeset: '/root/sub/fourth' },
								bodyElement: { type: 'input' },
							},
						],
					},
				},
			});
		});
	});

	describe('repeat subtrees', () => {
		beforeEach(() => {
			const xform = html(
				head(
					title('Model definition'),
					model(
						mainInstance(
							// prettier-ignore
							t(`root id="model-definition"`,
								// prettier-ignore
								t('rep jr:template=""',
									t('a', 'a default'),
									t('b', 'b default')),
								// prettier-ignore
								t('rep',
									t('a'),
									t('b')
								),

								// prettier-ignore
								t('rep2',
									t('c'),
									t('d')
								),

								// prettier-ignore
								t('rep3 jr:template=""',
									t('e', 'e default')
								),

								// prettier-ignore
								t('rep4 jr:template=""',
									t('f', 'f template default')
								),
								t('rep4',
									t('f', 'default instance f 0')
								),
								t('rep4',
									t('f')
								),
								t('rep4',
									t('f', 'default instance f 2')
								),

								// prettier-ignore
								t('rep5',
									t('g', 'default instance g 0')
								),
								t('rep5',
									t('g', 'default instance g 1')
								)
							)
						),
						bind('/root/rep/a').type('string'),
						bind('/root/rep/b').type('string'),
						bind('/root/rep2/c').type('string'),
						bind('/root/rep2/d').type('string'),
						bind('/root/rep3/e').type('string'),
						bind('/root/rep4/f').type('string'),
						bind('/root/rep5/g').type('string')
					)
				),
				// prettier-ignore
				body(
					group('/root/rep',
						repeat('/root/rep',
							input('/root/rep/a'),
							input('/root/rep/b')
						)
					),
					repeat('/root/rep2',
						input('/root/rep2/c')
					),
					repeat('/root/rep3',
						input('/root/rep3/e')
					),
					repeat('/root/rep4',
						input('/root/rep4/f')
					),
					repeat('/root/rep5',
						input('/root/rep5/g')
					)
				)
			);

			const xformDOM = XFormDOM.from(xform.asXml());
			const xformDefinition = new XFormDefinition(xformDOM);

			modelDefinition = xformDefinition.model;
		});

		it.each([
			{
				index: 0,
				expected: {
					type: 'repeat',
					bind: { nodeset: '/root/rep' },
					bodyElement: {
						type: 'repeat',
					},
				},
			},
			{
				index: 1,
				expected: {
					type: 'repeat',
					bind: { nodeset: '/root/rep2' },
					bodyElement: {
						type: 'repeat',
					},
				},
			},
		])(
			'defines a model repeat/instance subtree corresponding to a body repeat (index: $index)',
			({ index, expected }) => {
				expect(modelDefinition.root).toMatchObject({
					type: 'root',
					bind: { nodeset: '/root' },
					bodyElement: null,
					children: {
						[index]: expected,
					},
				});
			}
		);

		describe.todo('nesting');
	});
});
