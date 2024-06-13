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
} from '@getodk/common/test/fixtures/xform-dsl';
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
	const createRoot = (stateFactory: OpaqueReactiveObjectFactory): Root => {
		return scope.runTask(() => {
			return new Root(xformDefinition.xformDOM, xformDefinition.model.root, {
				createUniqueId,
				fetchResource,
				stateFactory,
			});
		});
	};

	describe('internals', () => {
		it('exposes a context node for XPath evaluation purposes', () => {
			const { contextNode } = reactiveTestScope(({ mutable }) => {
				return createRoot(mutable);
			});

			expect(contextNode).toBeInstanceOf(Element);
			expect(contextNode.nodeName).toBe('data');
		});

		it("produces instance root's the static nodeset reference", () => {
			const rootReference = reactiveTestScope(({ mutable }) => {
				const root = createRoot(mutable);

				return root.contextReference();
			});

			expect(rootReference).toBe('/data');
		});

		it('gets a node by reference', () => {
			const [q1] = reactiveTestScope(({ mutable }) => {
				const root = createRoot(mutable);

				return root.getSubscribableDependenciesByReference('/data/q1');
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
	const createRootNode = (stateFactory: OpaqueReactiveObjectFactory): RootNode => {
		return createRoot(stateFactory);
	};

	it('creates a Root instance', () => {
		const root = reactiveTestScope(({ mutable }) => {
			return createRootNode(mutable);
		});

		expect(root).toBeInstanceOf(Root);
	});

	describe('translation languages', () => {
		it("gets the form's available languages", () => {
			const languages = reactiveTestScope(({ mutable }) => {
				const root = createRootNode(mutable);

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

		it('gets the initial active language', () => {
			const activeLanguage = reactiveTestScope(({ mutable }) => {
				const root = createRootNode(mutable);

				return root.currentState.activeLanguage;
			});

			expect(activeLanguage).toEqual({
				language: 'English',
			});
		});

		it('sets the active language', () => {
			const { activeLanguage } = reactiveTestScope(({ mutable }) => {
				const root = createRootNode(mutable);

				root.setLanguage({
					language: 'Spanish',
				});

				return root.currentState;
			});

			expect(activeLanguage).toEqual({
				language: 'Spanish',
			});
		});

		it('fails to set a language not supported by the form', () => {
			const caught = reactiveTestScope(({ mutable }) => {
				const root = createRootNode(mutable);

				try {
					root.setLanguage({ language: 'Not supported' });
				} catch (error) {
					return error;
				}

				return null;
			});

			expect(caught).toBeInstanceOf(Error);
		});

		it('updates reactive client state on language change', () => {
			expect.assertions(2);

			const lastObservedClientLanguage = reactiveTestScope(
				({ mutable, effect }): ActiveLanguage | null => {
					const root = createRootNode(mutable);

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
		it(`gets the initial, static state of ${stateKey}`, () => {
			const state = reactiveTestScope(({ mutable }) => {
				const root = createRootNode(mutable);

				return root.currentState[stateKey];
			});

			expect(state).toBe(expectedValue);
		});

		it(`fails to set update the read-only state (currentState) of "${stateKey}" to ${invalidValue}`, () => {
			const caught = reactiveTestScope(({ mutable }) => {
				const root = createRootNode(mutable);

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

	it("gets the root node's first child", () => {
		const firstChild = reactiveTestScope(({ mutable }) => {
			const root = createRootNode(mutable);

			return root.currentState.children[0];
		});

		expect(firstChild).toBeInstanceOf(InstanceNode);
	});
});
