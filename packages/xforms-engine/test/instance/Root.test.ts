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
} from '@odk-web-forms/common/test/fixtures/xform-dsl';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { XFormDefinition } from '../../src/XFormDefinition.ts';
import type { FetchResource } from '../../src/client/EngineConfig.ts';
import type { ActiveLanguage } from '../../src/client/FormLanguage.ts';
import type { OpaqueReactiveObjectFactory } from '../../src/client/OpaqueReactiveObjectFactory.ts';
import type { RootNode } from '../../src/client/RootNode.ts';
import { Root } from '../../src/instance/Root.ts';
import { InstanceNode } from '../../src/instance/abstract/InstanceNode.ts';
import { createReactiveScope, type ReactiveScope } from '../../src/lib/reactivity/scope.ts';
import { createUniqueId } from '../../src/lib/unique-id.ts';
import { reactiveTestScope } from '../helpers/reactive/internal.ts';

describe('Instance root', () => {
	let scope: ReactiveScope;
	let xformDefinition: XFormDefinition;

	beforeEach(() => {
		scope = createReactiveScope();

		// prettier-ignore
		const xform = html(
			head(
				title('Form title'),
				model(
					t('itext',
						t('translation lang="English"',
							t('text id="q1:label"',
								t('value', '1. Question one'))),
						t('translation lang="Spanish"',
							t('text id="q1:label"',
								t('value', '1. Pregunta uno')))
					),
					mainInstance(
						t(`data id="root-test-form"`,
							t('q1')
						)
					),
					bind('/data/q1').type('string')
				)
			),
			body(
				input('/data/first-question', label('First question')),
				input('/data/second-question'),
				t('unknown-control ref="/data/third-question"')
			)
		);

		xformDefinition = new XFormDefinition(xform.asXml());
	});

	afterEach(() => {
		scope.dispose();
	});

	const fetchResource: FetchResource = () => {
		throw new Error('Nothing should fetch in these tests');
	};

	// Warning: this is a convenience function to slightly reduce repetitive
	// boilerplate across tests. Most tests should use `createRootNode` below.
	// Tests concerned with some aspects of internals may use this function
	// directly, with caution.
	const createRoot = async (stateFactory: OpaqueReactiveObjectFactory): Promise<Root> => {
		return scope.runTask(() => {
			return Root.initialize(xformDefinition.xformDOM, xformDefinition.model.root, {
				createUniqueId,
				fetchResource,
				stateFactory,
			});
		});
	};

	describe('internals', () => {
		it('exposes a context node for XPath evaluation purposes', async () => {
			const { contextNode } = await reactiveTestScope(({ mutable }) => {
				return createRoot(mutable);
			});

			expect(contextNode).toBeInstanceOf(Element);
			expect(contextNode.nodeName).toBe('data');
		});

		it("produces instance root's the static nodeset reference", async () => {
			const { contextReference } = await reactiveTestScope(({ mutable }) => {
				return createRoot(mutable);
			});

			expect(contextReference).toBe('/data');
		});

		it('gets a node by reference', async () => {
			const q1 = await reactiveTestScope(async ({ mutable }) => {
				const root = await createRoot(mutable);

				return root.getSubscribableDependencyByReference('/data/q1');
			});

			expect(q1).toBeInstanceOf(InstanceNode);
		});
	});

	// Note: for test purposes, this is returning the client `RootNode` type
	// rather than the more expansive `Root` type. Some tests will deal with
	// internals (i.e. to check certain prerequisites for functionality dealing
	// with graph computations), but the majority of tests should be focused on
	// client-facing functionality. Those tests should use this convenience
	// function if possible.
	const createRootNode = (stateFactory: OpaqueReactiveObjectFactory): Promise<RootNode> => {
		return createRoot(stateFactory);
	};

	it('creates a Root instance', async () => {
		const root = await reactiveTestScope(({ mutable }) => {
			return createRootNode(mutable);
		});

		expect(root).toBeInstanceOf(Root);
	});

	describe('translation languages', () => {
		it("gets the form's available languages", async () => {
			const languages = await reactiveTestScope(async ({ mutable }) => {
				const root = await createRootNode(mutable);

				return root.languages;
			});

			expect(languages).toEqual([
				{
					language: 'English',
				},
				{
					language: 'Spanish',
				},
			]);
		});

		it('gets the initial active language', async () => {
			const activeLanguage = await reactiveTestScope(async ({ mutable }) => {
				const root = await createRootNode(mutable);

				return root.currentState.activeLanguage;
			});

			expect(activeLanguage).toEqual({
				language: 'English',
			});
		});

		it('sets the active language', async () => {
			const { activeLanguage } = await reactiveTestScope(async ({ mutable }) => {
				const root = await createRootNode(mutable);

				root.setLanguage({
					language: 'Spanish',
				});

				return root.currentState;
			});

			expect(activeLanguage).toEqual({
				language: 'Spanish',
			});
		});

		it('fails to set a language not supported by the form', async () => {
			const caught = await reactiveTestScope(async ({ mutable }) => {
				const root = await createRootNode(mutable);

				try {
					root.setLanguage({ language: 'Not supported' });
				} catch (error) {
					return error;
				}

				return null;
			});

			expect(caught).toBeInstanceOf(Error);
		});

		it('updates reactive client state on language change', async () => {
			expect.assertions(2);

			const lastObservedClientLanguage = await reactiveTestScope(
				async ({ mutable, effect }): Promise<ActiveLanguage | null> => {
					const root = await createRootNode(mutable);

					let observedClientLanguage: ActiveLanguage | null = null;

					effect(() => {
						observedClientLanguage = root.currentState.activeLanguage;
					});

					// The above `effect` was run immediately. Assert to confirm that
					// assumption, then revert its state to `null` so we can be sure we're
					// testing the subsequent effect after explicitly updating the state.
					expect(observedClientLanguage).toEqual({ language: 'English' });
					observedClientLanguage = null;

					// Here is the actual action under test: this call should trigger the
					// client's `effect`.
					root.setLanguage({ language: 'Spanish' });

					return observedClientLanguage;
				}
			);

			expect(lastObservedClientLanguage).toEqual({ language: 'Spanish' });
		});
	});

	describe.each([
		{ stateKey: 'reference', expectedValue: '/data', invalidValue: '/data2' },
		{ stateKey: 'label', expectedValue: null },
		{ stateKey: 'hint', expectedValue: null },
		{ stateKey: 'readonly', expectedValue: false, invalidValue: true },
		{ stateKey: 'relevant', expectedValue: true, invalidValue: false },
		{ stateKey: 'required', expectedValue: false, invalidValue: true },
		{ stateKey: 'valueOptions', expectedValue: null },
		{ stateKey: 'value', expectedValue: null },
	] as const)('$stateKey state', ({ stateKey, expectedValue, invalidValue }) => {
		it(`gets the initial, static state of ${stateKey}`, async () => {
			const state = await reactiveTestScope(async ({ mutable }) => {
				const root = await createRootNode(mutable);

				return root.currentState[stateKey];
			});

			expect(state).toBe(expectedValue);
		});

		it(`fails to set update the read-only state (currentState) of "${stateKey}" to ${invalidValue}`, async () => {
			const caught = await reactiveTestScope(async ({ mutable }) => {
				const root = await createRootNode(mutable);

				try {
					// @ts-expect-error - intentionally ignore unsafe assignment to
					// readonly property
					root.currentState[stateKey] = invalidValue;
				} catch (error) {
					return error;
				}

				return null;
			});

			expect(caught).toBeInstanceOf(TypeError);
		});
	});

	it("gets the root node's first child", async () => {
		const firstChild = await reactiveTestScope(async ({ mutable }) => {
			const root = await createRootNode(mutable);

			return root.currentState.children[0];
		});

		expect(firstChild).toBeInstanceOf(InstanceNode);
	});
});
