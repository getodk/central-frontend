import {
	bind,
	body,
	group,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { createRoot } from 'solid-js';
import { createMutable } from 'solid-js/store';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AnyNode, RootNode, StringNode } from '../../src/index.ts';
import { initializeForm } from '../../src/index.ts';
import { Root } from '../../src/instance/Root.ts';
import { InstanceNode } from '../../src/instance/abstract/InstanceNode.ts';

interface IntializedTestForm {
	readonly dispose: VoidFunction;
	readonly rootNode: RootNode;

	/**
	 * Note: some tests intentionally check internal details which aren't
	 * presently exposed in the client interface. A best effort has been made to
	 * only reference the internal implementation type as necessary for that,
	 * and to reference client-facing types otherwise.
	 */
	readonly internalRoot: Root;
}

const initializeTestForm = async (xformXML: string): Promise<IntializedTestForm> => {
	return createRoot(async (dispose) => {
		const rootNode = await initializeForm(xformXML, {
			config: {
				stateFactory: createMutable,
			},
		});

		let internalRoot: Root;

		if (rootNode instanceof Root) {
			internalRoot = rootNode;
		} else {
			expect.fail(
				'Instance created with `initializeForm` is not an instance of `Root`. Testing internals will likely fail!'
			);
		}

		return {
			dispose,
			rootNode,
			internalRoot,
		};
	});
};

describe('Form instance state', () => {
	let testForm: IntializedTestForm;

	const getNodeByReference = <T extends AnyNode = AnyNode>(reference: string): T | null => {
		const [node] = testForm.internalRoot.getNodesByReference(new WeakSet(), reference);

		return (node ?? null) as T | null;
	};

	const getStringNode = (reference: string): StringNode => {
		const node = getNodeByReference(reference);

		if (node == null) {
			throw new Error(`No node for reference: ${reference}`);
		}

		if (node.nodeType === 'string') {
			return node;
		}

		throw new Error(`Node with reference ${reference} not a StringNode`);
	};

	const getPrimaryInstanceValue = (node: AnyNode | null): string => {
		if (node instanceof InstanceNode) {
			return node.contextNode.textContent!;
		}

		throw new Error('Cannot get internal primary instance state from node');
	};

	afterEach(() => {
		testForm.dispose();
	});

	describe('basic calculation', () => {
		beforeEach(async () => {
			const xform = html(
				head(
					title('Basic calculation'),
					model(
						mainInstance(
							// Preserve indentation...
							t(
								'root id="minimal"',
								// ...
								t('first-question', '1'),
								t('second-question')
							)
						),
						bind('/root/first-question').type('string'),
						bind('/root/second-question').calculate('/root/first-question * 2')
					)
				),
				body(input('/root/first-question'), input('/root/second-question'))
			);

			testForm = await initializeTestForm(xform.asXml());
		});

		it('calculates the bound question state on initialization', () => {
			const node = getNodeByReference('/root/second-question');

			expect(node?.currentState.value).toBe('2');
		});

		it('updates the calculated DOM node with the calculated value', () => {
			const second = getNodeByReference('/root/second-question');
			const secondValue = getPrimaryInstanceValue(second);

			expect(secondValue).toBe('2');
		});

		it.each([
			{ firstValue: '2', expected: '4' },
			{ firstValue: '', expected: 'NaN' },
		])(
			'updates the calculation to $expected when its dependency value is updated to $firstValue',
			({ firstValue, expected }) => {
				const first = getStringNode('/root/first-question');
				const second = getNodeByReference('/root/second-question')!;

				first.setValue(firstValue);

				expect(second.currentState.value).toBe(expected);
				expect(getPrimaryInstanceValue(second)).toBe(expected);
			}
		);

		it('sets an arbitrary value overriding the calculated value', () => {
			const first = getStringNode('/root/first-question');
			const second = getStringNode('/root/second-question');

			first.setValue('1');
			second.setValue('234');

			expect(second.currentState.value).toBe('234');
			expect(getPrimaryInstanceValue(second)).toBe('234');
		});

		it("overrides the arbitrary value with a new calculation when the calculation's dependency is updated", () => {
			const first = getStringNode('/root/first-question');
			const second = getStringNode('/root/second-question');

			first.setValue('1');
			second.setValue('234');
			first.setValue('3');

			expect(second.currentState.value).toBe('6');
			expect(getPrimaryInstanceValue(second)).toBe('6');
		});
	});

	describe('basic relevance', () => {
		beforeEach(async () => {
			const xform = html(
				head(
					title('Basic relevance'),
					model(
						mainInstance(
							// Preserve indentation...
							t(
								'root id="minimal"',
								// ...
								t('first-question', '1'),
								t('second-question', 'default if relevant'),
								t(
									'parent-group',
									// ...
									t('child-question')
								)
							)
						),
						bind('/root/first-question').type('string'),
						bind('/root/second-question').relevant('/root/first-question &gt; 2'),
						bind('/root/parent-group').relevant('/root/first-question &lt; 2'),
						bind('/root/parent-group/child-question').type('string')
					)
				),
				body(
					input('/root/first-question'),
					input('/root/second-question'),
					group('/root/parent-group', input('/root/parent-group/child-question'))
				)
			);

			testForm = await initializeTestForm(xform.asXml());
		});

		it('clears the value when non-relevant', () => {
			const second = getStringNode('/root/second-question');

			expect(getPrimaryInstanceValue(second)).toBe('');
		});

		it('stores the DOM value when relevant', () => {
			const first = getStringNode('/root/first-question');

			first.setValue('3');

			const second = getStringNode('/root/second-question');

			expect(getPrimaryInstanceValue(second)).toBe('default if relevant');
		});

		it('restores the DOM value when it becomes relevant again', () => {
			const first = getStringNode('/root/first-question');

			first.setValue('3');

			const second = getStringNode('/root/second-question');

			second.setValue('updated value');

			// Check assumptions
			expect(getPrimaryInstanceValue(second)).toBe('updated value');

			first.setValue('1');

			// Check assumptions
			expect(getPrimaryInstanceValue(second)).toBe('');

			first.setValue('3');
			expect(getPrimaryInstanceValue(second)).toBe('updated value');
		});

		describe('relevance inheritance', () => {
			it('clears the child of a non-relevant parent', () => {
				const first = getStringNode('/root/first-question');
				const parent = getNodeByReference('/root/parent-group')!;
				const child = getStringNode('/root/parent-group/child-question');

				child.setValue('anything');
				first.setValue('3');

				// Check assumptions
				expect(parent.currentState.relevant).toBe(false);
				expect(child.currentState.relevant).toBe(false);

				expect(getPrimaryInstanceValue(child)).toBe('');
			});

			it('restores the child value of a parent which becomes relevant', () => {
				const first = getStringNode('/root/first-question');
				const parent = getNodeByReference('/root/parent-group')!;
				const child = getStringNode('/root/parent-group/child-question');

				child.setValue('anything');
				first.setValue('3');
				first.setValue('1');

				// Check assumptions
				expect(parent.currentState.relevant).toBe(true);
				expect(child.currentState.relevant).toBe(true);

				expect(child.currentState.value).toBe('anything');
				expect(getPrimaryInstanceValue(child)).toBe('anything');
			});
		});
	});

	describe('relevance and calculation together', () => {
		beforeEach(async () => {
			const xform = html(
				head(
					title('Relevant and calculate'),
					model(
						mainInstance(
							// Preserve indentation...
							t(
								'root id="minimal"',
								// ...
								t('first-question', '1'),
								t('second-question', 'no'),
								t('third-question')
							)
						),
						bind('/root/first-question').type('string'),
						bind('/root/second-question').type('string'),
						bind('/root/third-question')
							.calculate('/root/first-question * 3')
							.relevant("selected(/root/second-question, 'yes')")
					)
				),
				body(
					input('/root/first-question'),
					input('/root/second-question'),
					input('/root/third-question')
				)
			);

			testForm = await initializeTestForm(xform.asXml());
		});

		it('clears the value when non-relevant', () => {
			const third = getStringNode('/root/third-question');

			expect(getPrimaryInstanceValue(third)).toBe('');
		});

		it('calculates the value when it becomes relevant', () => {
			const second = getStringNode('/root/second-question');
			const third = getStringNode('/root/third-question');

			second.setValue('yes');

			expect(third.currentState.value).toBe('3');
			expect(getPrimaryInstanceValue(third)).toBe('3');
		});

		it.each([
			{ firstValue: '2', expected: '6' },
			{ firstValue: '0', expected: '0' },
			{ firstValue: '', expected: 'NaN' },
		])(
			'updates the calculated value $expected while it is relevant',
			({ firstValue, expected }) => {
				const first = getStringNode('/root/first-question');
				const second = getStringNode('/root/second-question');
				const third = getStringNode('/root/third-question');

				second.setValue('yes');
				first.setValue(firstValue);

				expect(third.currentState.value).toBe(expected);
				expect(getPrimaryInstanceValue(third)).toBe(expected);
			}
		);

		it.each([
			{ firstValue: '2', expected: '6' },
			{ firstValue: '0', expected: '0' },
			{ firstValue: '', expected: 'NaN' },
		])(
			'updates the calculated value $expected when it becomes relevant after the calculated dependency has been updated',
			({ firstValue, expected }) => {
				const first = getStringNode('/root/first-question');
				const second = getStringNode('/root/second-question');
				const third = getStringNode('/root/third-question');

				first.setValue('20');
				second.setValue('no');

				first.setValue(firstValue);
				second.setValue('yes');

				expect(third.currentState.value).toBe(expected);
				expect(getPrimaryInstanceValue(third)).toBe(expected);
			}
		);

		// This behavior was intentionally left out in the transition to the new
		// client interface.
		it.fails(
			'restores an arbitrary value without recalculating when becoming relevant again',
			() => {
				const first = getStringNode('/root/first-question');
				const second = getStringNode('/root/second-question');
				const third = getStringNode('/root/third-question');

				first.setValue('20');
				third.setValue('999');
				second.setValue('no');
				second.setValue('yes');

				expect(third.currentState.value).toBe('999');
				expect(getPrimaryInstanceValue(third)).toBe('999');
			}
		);
	});

	describe('required', () => {
		beforeEach(async () => {
			const xform = html(
				head(
					title('Required'),
					model(
						mainInstance(
							// Preserve indentation...
							t(
								'root id="minimal"',
								// ...
								t('first-question', '2'),
								t('second-question')
							)
						),
						bind('/root/first-question').type('string'),
						bind('/root/second-question').type('string').required('/root/first-question &gt; 1')
					)
				),
				body(input('/root/first-question'), input('/root/second-question'))
			);

			testForm = await initializeTestForm(xform.asXml());
		});

		it("computes the state's required condition on initialization", () => {
			const second = getNodeByReference('/root/second-question');

			expect(second?.currentState.required).toBe(true);
		});

		it("recomputes the state's required condition when a dependency changes", () => {
			const first = getStringNode('/root/first-question');
			const second = getStringNode('/root/second-question');

			first.setValue('1');

			expect(second.currentState.required).toBe(false);

			first.setValue('3');

			expect(second.currentState.required).toBe(true);
		});
	});

	describe('readonly', () => {
		beforeEach(async () => {
			const xform = html(
				head(
					title('Readonly'),
					model(
						mainInstance(
							// Preserve indentation...
							t(
								'root id="minimal"',
								// ...
								t('first-question', '2'),
								t('second-question')
							)
						),
						bind('/root/first-question').type('string'),
						bind('/root/second-question').type('string').readonly('/root/first-question &gt; 1')
					)
				),
				body(input('/root/first-question'), input('/root/second-question'))
			);

			testForm = await initializeTestForm(xform.asXml());
		});

		it("computes the state's readonly condition on initialization", () => {
			const second = getNodeByReference('/root/second-question');

			expect(second?.currentState.readonly).toBe(true);
		});

		it("recomputes the state's readonly condition when a dependency changes", () => {
			const first = getStringNode('/root/first-question');
			const second = getStringNode('/root/second-question');

			first.setValue('1');

			expect(second.currentState.readonly).toBe(false);

			first.setValue('3');

			expect(second.currentState.readonly).toBe(true);
		});

		describe('readonly inheritance', () => {
			beforeEach(async () => {
				const xform = html(
					head(
						title('Readonly'),
						model(
							mainInstance(
								// Preserve indentation...
								t(
									'root id="minimal"',
									t('a', 'a default'),
									// ...
									t(
										'grp',
										// ...
										t('b'),
										t('c')
									)
								)
							),
							bind('/root/a'),
							bind('/root/grp').readonly("/root/a = 'set b readonly'"),
							bind('/root/grp/b'),
							bind('/root/grp/c').readonly("/root/grp/b = 'yep'")
						)
					),
					body(input('/root/a'), group('/root/grp', input('/root/grp/b'), input('/root/grp/c')))
				);

				testForm = await initializeTestForm(xform.asXml());
			});

			it('is readonly if a parent is readonly', () => {
				const a = getStringNode('/root/a');
				const b = getStringNode('/root/grp/b');

				// Check assumptions
				expect(b.currentState.readonly).toBe(false);

				a.setValue('set b readonly');

				expect(b.currentState.readonly).toBe(true);
			});

			it('is not readonly if the parent is no longer readonly', () => {
				const a = getStringNode('/root/a');
				const b = getStringNode('/root/grp/b');

				a.setValue('set b readonly');

				// Check assumptions
				expect(b.currentState.readonly).toBe(true);

				a.setValue('not anymore');

				expect(b.currentState.readonly).toBe(false);
			});

			it('remains readonly for its own condition if the parent is not readonly', () => {
				const a = getStringNode('/root/a');
				const b = getStringNode('/root/grp/b');
				const c = getStringNode('/root/grp/c');

				b.setValue('yep');

				// Check assumptions
				expect(c.currentState.readonly).toBe(true);

				a.setValue('set b readonly');

				// Check assumptions
				expect(c.currentState.readonly).toBe(true);

				a.setValue('not anymore');

				expect(c.currentState.readonly).toBe(true);
			});

			it("is no longer readonly if both its own condition and parent's are not satisfied", () => {
				const a = getStringNode('/root/a');
				const b = getStringNode('/root/grp/b');
				const c = getStringNode('/root/grp/c');

				b.setValue('yep');

				// Check assumptions
				expect(c.currentState.readonly).toBe(true);

				a.setValue('set b readonly');

				// Check assumptions
				expect(c.currentState.readonly).toBe(true);

				a.setValue('not anymore');
				b.setValue('');

				expect(c.currentState.readonly).toBe(false);
			});
		});

		describe.todo('write prevention');
	});
});
