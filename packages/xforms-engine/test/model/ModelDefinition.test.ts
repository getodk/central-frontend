import { expectEqualNode } from '@getodk/common/test/assertions/dom.ts';
import { xformsElement } from '@getodk/common/test/factories/xml.ts';
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
import { XFormDefinition } from '../../src/XFormDefinition.ts';
import { BindDefinition } from '../../src/model/BindDefinition.ts';
import type { LeafNodeDefinition } from '../../src/model/LeafNodeDefinition.ts';
import { ModelDefinition } from '../../src/model/ModelDefinition.ts';
import type { RepeatRangeDefinition } from '../../src/model/RepeatRangeDefinition.ts';

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
							t('third-question')
						)
					),
					bind('/root/first-question').type('string'),
					bind('/root/second-question').type('string'),
					bind('/root/third-question').type('string')
				)
			),
			// prettier-ignore
			body(
				input('/root/first-question', label('First question')),
				input('/root/second-question')
			)
		);

		const xformDefinition = new XFormDefinition(xform.asXml());

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

			const xformDefinition = new XFormDefinition(xform.asXml());

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

			const xformDefinition = new XFormDefinition(xform.asXml());

			modelDefinition = xformDefinition.model;
		});

		it.each([
			{
				index: 0,
				expected: {
					type: 'repeat-range',
					bind: { nodeset: '/root/rep' },
					bodyElement: {
						type: 'repeat',
					},
					instances: [
						{
							type: 'repeat-instance',
							bodyElement: {
								type: 'repeat',
							},
							children: [
								{
									type: 'leaf-node',
									bind: { nodeset: '/root/rep/a' },
									bodyElement: { type: 'input' },
								},
								{
									type: 'leaf-node',
									bind: { nodeset: '/root/rep/b' },
									bodyElement: { type: 'input' },
								},
							],
						},
					],
				},
			},
			{
				index: 1,
				expected: {
					type: 'repeat-range',
					bind: { nodeset: '/root/rep2' },
					bodyElement: {
						type: 'repeat',
					},
					instances: [
						{
							type: 'repeat-instance',
							bodyElement: {
								type: 'repeat',
							},
							children: [
								{
									type: 'leaf-node',
									bind: { nodeset: '/root/rep2/c' },
									bodyElement: { type: 'input' },
								},
								{
									type: 'leaf-node',
									bind: { nodeset: '/root/rep2/d' },
									bodyElement: null,
								},
							],
						},
					],
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

		describe('templates', () => {
			const expectRepeatTemplate = (definition: RepeatRangeDefinition, expectedXML: string) => {
				const expected = xformsElement`${expectedXML}`;

				expectEqualNode(definition.template.node, expected);
			};

			it('defines an explicit repeat template', () => {
				const definition = modelDefinition.root.children[0] as RepeatRangeDefinition;

				expectRepeatTemplate(definition, /* xml */ `<rep><a>a default</a><b>b default</b></rep>`);
			});

			it('derives a repeat template from a non-template instance in the form definition', () => {
				const definition = modelDefinition.root.children[1] as RepeatRangeDefinition;

				expectRepeatTemplate(definition, /* xml */ `<rep2><c /><d /></rep2>`);
			});

			it('clears default values from a derived template', () => {
				const definition = modelDefinition.root.children[4] as RepeatRangeDefinition;

				expectRepeatTemplate(definition, /* xml */ `<rep5><g /></rep5>`);
			});

			it.each([
				{ index: 1, expected: 1 },
				{ index: 4, expected: 2 },
			])(
				'defines $expected default instances from nodes in the form definition when a repeat template is implicitly derived',
				({ index, expected }) => {
					const definition = modelDefinition.root.children[index] as RepeatRangeDefinition;

					expect(definition.instances.length).toBe(expected);
				}
			);

			it.fails('rejects multiple templates for the same repeat', () => {
				const xform = html(
					head(
						title('Model definition'),
						model(
							mainInstance(
								// prettier-ignore
								t(`root id="model-definition"`,
									// prettier-ignore
									t('rep',
										t('rep2 jr:template=""'),
										t('rep2',
											t('a'),
											t('b')
										)
									),
									t('rep',
										t('rep2 jr:template=""'),
										t('rep2',
											t('a'),
											t('b')
										)
									)
								)
							),
							bind('/root/rep/rep2/a').type('string'),
							bind('/root/rep/rep2/b').type('string')
						)
					),
					// prettier-ignore
					body(
						group('/root/rep',
							repeat('/root/rep',
								group('/root/rep/rep2',
									repeat('/group/rep/rep2',
										input('/root/rep/rep2/a'),
										input('/root/rep/rep2/b')
									)
								)
							)
						)
					)
				);

				expect(() => new XFormDefinition(xform.asXml())).toThrow(
					'Multiple explicit templates defined for /root/rep/rep2'
				);
			});
		});

		describe('default instances', () => {
			it.each([
				{
					nodeset: '/root/rep',
					index: 0,
					expected: 1,
				},

				{
					nodeset: '/root/rep2',
					index: 1,
					expected: 1,
				},

				// Not sure!
				// {
				// 	nodeset: '/root/rep3',
				// 	index: 0,
				// 	expected: NaN,
				// },

				{
					nodeset: '/root/rep4',
					index: 3,
					expected: 3,
				},
			])('defines $expected default instances ($nodeset)', ({ index, nodeset, expected }) => {
				const definition = modelDefinition.root.children[index] as RepeatRangeDefinition;

				// Ensure we're testing the right range in the first place
				expect(definition.nodeset).toBe(nodeset);

				expect(definition.instances.length).toBe(expected);
			});

			it.each([
				{
					nodeset: '/root/rep4',
					rangeIndex: 3,
					instanceIndex: 0,
					expectedXML: /* xml */ `<rep4><f>default instance f 0</f></rep4>`,
				},
				{
					nodeset: '/root/rep4',
					rangeIndex: 3,
					instanceIndex: 1,
					expectedXML: /* xml */ `<rep4><f /></rep4>`,
				},
				{
					nodeset: '/root/rep4',
					rangeIndex: 3,
					instanceIndex: 2,
					expectedXML: /* xml */ `<rep4><f>default instance f 2</f></rep4>`,
				},
			])(
				'defines the default instance for nodeset $nodeset at index $instanceIndex with default values (xml: $expectedXML)',
				({ nodeset, rangeIndex, instanceIndex, expectedXML }) => {
					const definition = modelDefinition.root.children[rangeIndex] as RepeatRangeDefinition;

					// Ensure we're testing the right range in the first place
					expect(definition.nodeset).toBe(nodeset);

					const instance = definition.instances[instanceIndex]!;
					const expected = xformsElement`${expectedXML}`;

					expectEqualNode(instance.node, expected);
				}
			);
		});

		describe.todo('nesting');
	});
});
