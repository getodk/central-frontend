import { createRoot } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	bind,
	body,
	head,
	html,
	mainInstance,
	model,
	t,
	title,
} from '../../test/fixtures/xform-dsl/index.ts';
import { XFormDefinition } from '../xform/XFormDefinition.ts';
import { XFormEntry } from '../xform/XFormEntry.ts';

describe('Model state reactive computations', () => {
	describe('basic calculation', () => {
		let dispose: () => void;
		let entry: XFormEntry;

		beforeEach(() => {
			[dispose, entry] = createRoot((disposeRoot) => {
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
					body()
				);

				const definition = new XFormDefinition(xform.asXml());

				return [disposeRoot, new XFormEntry(definition)];
			});
		});

		afterEach(() => {
			dispose();
		});

		it('calculates the bound question state on initialization', () => {
			const binding = entry.getBinding('/root/second-question')!;

			expect(binding.getValue()).toBe('2');
		});

		it('updates the calculated DOM node with the calculated value', () => {
			const binding = entry.getBinding('/root/second-question')!;

			expect(binding.getModelElement().textContent).toBe('2');
		});

		it.each([
			{ firstValue: '2', expected: '4' },
			{ firstValue: '', expected: 'NaN' },
		])(
			'updates the calculation to $expected when its dependency value is updated to $firstValue',
			({ firstValue, expected }) => {
				const first = entry.getBinding('/root/first-question')!;
				const second = entry.getBinding('/root/second-question')!;

				first.setValue(firstValue);

				expect(second.getValue()).toBe(expected);
				expect(second.getModelElement().textContent).toBe(expected);
			}
		);

		it('sets an arbitrary value overriding the calculated value', () => {
			const first = entry.getBinding('/root/first-question')!;
			const second = entry.getBinding('/root/second-question')!;

			first.setValue('1');
			second.setValue('234');

			expect(second.getValue()).toBe('234');
			expect(second.getModelElement().textContent).toBe('234');
		});

		it("overrides the arbitrary value with a new calculation when the calculation's dependency is updated", () => {
			const first = entry.getBinding('/root/first-question')!;
			const second = entry.getBinding('/root/second-question')!;

			first.setValue('1');
			second.setValue('234');
			first.setValue('3');

			expect(second.getValue()).toBe('6');
			expect(second.getModelElement().textContent).toBe('6');
		});
	});

	describe('basic relevance', () => {
		let dispose: () => void;
		let entry: XFormEntry;

		beforeEach(() => {
			[dispose, entry] = createRoot((disposeRoot) => {
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
					body()
				);

				const definition = new XFormDefinition(xform.asXml());

				return [disposeRoot, new XFormEntry(definition)];
			});
		});

		afterEach(() => {
			dispose();
		});

		it('clears the value when non-relevant', () => {
			const binding = entry.getBinding('/root/second-question')!;

			expect(binding.getModelElement().textContent).toBe('');
		});

		it('stores the DOM value when relevant', () => {
			const first = entry.getBinding('/root/first-question')!;

			first.setValue('3');

			const second = entry.getBinding('/root/second-question')!;

			expect(second.getModelElement().textContent).toBe('default if relevant');
		});

		it('restores the DOM value when it becomes relevant again', () => {
			const first = entry.getBinding('/root/first-question')!;

			first.setValue('3');

			const second = entry.getBinding('/root/second-question')!;

			second.setValue('updated value');

			// Check assumptions
			expect(second.getModelElement().textContent).toBe('updated value');

			first.setValue('1');

			// Check assumptions
			expect(second.getModelElement().textContent).toBe('');

			first.setValue('3');
			expect(second.getModelElement().textContent).toBe('updated value');
		});

		describe('relevance inheritance', () => {
			it('clears the child of a non-relevant parent', () => {
				const first = entry.getBinding('/root/first-question')!;
				const parent = entry.getBinding('/root/parent-group')!;
				const child = entry.getBinding('/root/parent-group/child-question')!;

				child.setValue('anything');
				first.setValue('3');

				// Check assumptions
				expect(parent.isRelevant()).toBe(false);
				expect(child.isRelevant()).toBe(false);

				expect(child.getModelElement().textContent).toBe('');
			});

			it('restores the child value of a parent which becomes relevant', () => {
				const first = entry.getBinding('/root/first-question')!;
				const parent = entry.getBinding('/root/parent-group')!;
				const child = entry.getBinding('/root/parent-group/child-question')!;

				child.setValue('anything');
				first.setValue('3');
				first.setValue('1');

				// Check assumptions
				expect(parent.isRelevant()).toBe(true);
				expect(child.isRelevant()).toBe(true);

				expect(child.getValue()).toBe('anything');
				expect(child.getModelElement().textContent).toBe('anything');
			});
		});
	});

	describe('relevance and calculation together', () => {
		let dispose: () => void;
		let entry: XFormEntry;

		beforeEach(() => {
			[dispose, entry] = createRoot((disposeRoot) => {
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
					body()
				);

				const definition = new XFormDefinition(xform.asXml());

				return [disposeRoot, new XFormEntry(definition)];
			});
		});

		afterEach(() => {
			dispose();
		});

		it('clears the value when non-relevant', () => {
			const binding = entry.getBinding('/root/third-question')!;

			expect(binding.getModelElement().textContent).toBe('');
		});

		it('calculates the value when it becomes relevant', () => {
			const second = entry.getBinding('/root/second-question')!;
			const third = entry.getBinding('/root/third-question')!;

			second.setValue('yes');

			expect(third.getValue()).toBe('3');
			expect(third.getModelElement().textContent).toBe('3');
		});

		it.each([
			{ firstValue: '2', expected: '6' },
			{ firstValue: '0', expected: '0' },
			{ firstValue: '', expected: 'NaN' },
		])(
			'updates the calculated value $expected while it is relevant',
			({ firstValue, expected }) => {
				const first = entry.getBinding('/root/first-question')!;
				const second = entry.getBinding('/root/second-question')!;
				const third = entry.getBinding('/root/third-question')!;

				second.setValue('yes');
				first.setValue(firstValue);

				expect(third.getValue()).toBe(expected);
				expect(third.getModelElement().textContent).toBe(expected);
			}
		);

		it.each([
			{ firstValue: '2', expected: '6' },
			{ firstValue: '0', expected: '0' },
			{ firstValue: '', expected: 'NaN' },
		])(
			'updates the calculated value $expected when it becomes relevant after the calculated dependency has been updated',
			({ firstValue, expected }) => {
				const first = entry.getBinding('/root/first-question')!;
				const second = entry.getBinding('/root/second-question')!;
				const third = entry.getBinding('/root/third-question')!;

				first.setValue('20');
				second.setValue('no');

				first.setValue(firstValue);
				second.setValue('yes');

				expect(third.getValue()).toBe(expected);
				expect(third.getModelElement().textContent).toBe(expected);
			}
		);

		it('restores an arbitrary value without recalculating when becoming relevant again', () => {
			const first = entry.getBinding('/root/first-question')!;
			const second = entry.getBinding('/root/second-question')!;
			const third = entry.getBinding('/root/third-question')!;

			first.setValue('20');
			third.setValue('999');
			second.setValue('no');
			second.setValue('yes');

			expect(third.getValue()).toBe('999');
			expect(third.getModelElement().textContent).toBe('999');
		});
	});

	describe('required', () => {
		let dispose: () => void;
		let entry: XFormEntry;

		beforeEach(() => {
			[dispose, entry] = createRoot((disposeRoot) => {
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
					body()
				);

				const definition = new XFormDefinition(xform.asXml());

				return [disposeRoot, new XFormEntry(definition)];
			});
		});

		afterEach(() => {
			dispose();
		});

		it("computes the binding's required state on initialization", () => {
			const second = entry.getBinding('/root/second-question')!;

			expect(second.isRequired()).toBe(true);
		});

		it("recomputes the binding's required state when a dependency changes", () => {
			const first = entry.getBinding('/root/first-question')!;
			const second = entry.getBinding('/root/second-question')!;

			first.setValue('1');

			expect(second.isRequired()).toBe(false);

			first.setValue('3');

			expect(second.isRequired()).toBe(true);
		});
	});

	describe('readonly', () => {
		let dispose: () => void;
		let entry: XFormEntry;

		beforeEach(() => {
			[dispose, entry] = createRoot((disposeRoot) => {
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
					body()
				);

				const definition = new XFormDefinition(xform.asXml());

				return [disposeRoot, new XFormEntry(definition)];
			});
		});

		afterEach(() => {
			dispose();
		});

		it("computes the binding's readonly state on initialization", () => {
			const second = entry.getBinding('/root/second-question')!;

			expect(second.isReadonly()).toBe(true);
		});

		it("recomputes the binding's readonly state when a dependency changes", () => {
			const first = entry.getBinding('/root/first-question')!;
			const second = entry.getBinding('/root/second-question')!;

			first.setValue('1');

			expect(second.isReadonly()).toBe(false);

			first.setValue('3');

			expect(second.isReadonly()).toBe(true);
		});

		describe('readonly inheritance', () => {
			let dispose: () => void;
			let entry: XFormEntry;

			beforeEach(() => {
				[dispose, entry] = createRoot((disposeRoot) => {
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
						body()
					);

					const definition = new XFormDefinition(xform.asXml());

					return [disposeRoot, new XFormEntry(definition)];
				});
			});

			afterEach(() => {
				dispose();
			});

			it('is readonly if a parent is readonly', () => {
				const a = entry.getBinding('/root/a')!;
				const b = entry.getBinding('/root/grp/b')!;

				// Check assumptions
				expect(b.isReadonly()).toBe(false);

				a.setValue('set b readonly');

				expect(b.isReadonly()).toBe(true);
			});

			it('is not readonly if the parent is no longer readonly', () => {
				const a = entry.getBinding('/root/a')!;
				const b = entry.getBinding('/root/grp/b')!;

				a.setValue('set b readonly');

				// Check assumptions
				expect(b.isReadonly()).toBe(true);

				a.setValue('not anymore');

				expect(b.isReadonly()).toBe(false);
			});

			it('remains readonly for its own condition if the parent is not readonly', () => {
				const a = entry.getBinding('/root/a')!;
				const b = entry.getBinding('/root/grp/b')!;
				const c = entry.getBinding('/root/grp/c')!;

				b.setValue('yep');

				// Check assumptions
				expect(c.isReadonly()).toBe(true);

				a.setValue('set b readonly');

				// Check assumptions
				expect(c.isReadonly()).toBe(true);

				a.setValue('not anymore');

				expect(c.isReadonly()).toBe(true);
			});

			it("is no longer readonly if both its own condition and parent's are not satisfied", () => {
				const a = entry.getBinding('/root/a')!;
				const b = entry.getBinding('/root/grp/b')!;
				const c = entry.getBinding('/root/grp/c')!;

				b.setValue('yep');

				// Check assumptions
				expect(c.isReadonly()).toBe(true);

				a.setValue('set b readonly');

				// Check assumptions
				expect(c.isReadonly()).toBe(true);

				a.setValue('not anymore');
				b.setValue('');

				expect(c.isReadonly()).toBe(false);
			});
		});

		describe.todo('write prevention');
	});
});
