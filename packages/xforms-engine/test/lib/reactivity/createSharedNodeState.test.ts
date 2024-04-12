import type { Accessor, Signal } from 'solid-js';
import { createComputed, createMemo, createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSharedNodeState } from '../../../src/lib/reactivity/node-state/createSharedNodeState.ts';
import type { ReactiveScope } from '../../../src/lib/reactivity/scope.ts';
import { createReactiveScope } from '../../../src/lib/reactivity/scope.ts';
import { reactiveTestScope } from '../../helpers/reactive/internal.ts';

describe('Engine/Client state', () => {
	let rootScope: ReactiveScope;

	interface InitialTestState {
		readonly readonly: boolean;
		readonly relevant: boolean;
		readonly required: boolean;
	}

	// For better `it.each` descriptions
	const createSerializableSignal = <T>(initialValue: T): Signal<T> => {
		const signal = createSignal(initialValue);
		const [get] = signal;

		return Object.assign(signal, {
			toJSON() {
				return `Signal<${String(get())}>`;
			},
		});
	};

	const createConstantMemo = <T>(value: T): Accessor<T> => {
		return Object.assign(() => value, {
			toJSON() {
				return `Accessor<${String(value)}>`;
			},
		}) as Accessor<T>;
	};

	interface DefaultTestStateSpec {
		readonly readonly: Signal<boolean>;
		readonly relevant: Accessor<boolean>;
		readonly required: boolean;
	}

	class InitialTestStateSpec implements DefaultTestStateSpec {
		readonly readonly: Signal<boolean>;
		readonly relevant: Accessor<boolean>;
		readonly required: boolean;

		constructor(initialState: InitialTestState) {
			const { readonly, relevant, required } = initialState;

			this.readonly = createSerializableSignal(readonly);
			this.relevant = createConstantMemo(relevant);
			this.required = required;
		}
	}

	beforeEach(() => {
		rootScope = createReactiveScope();
	});

	afterEach(() => {
		rootScope.dispose();
	});

	const initialStateSpecs: readonly InitialTestStateSpec[] = [
		{
			readonly: createSerializableSignal(true),
			relevant: createConstantMemo(false),
			required: true,
		},
		{
			readonly: createSerializableSignal(false),
			relevant: createConstantMemo(true),
			required: false,
		},
	];

	const getCurrentState = (spec: InitialTestStateSpec): InitialTestState => {
		const [getReadonly] = spec.readonly;

		return {
			readonly: getReadonly(),
			relevant: spec.relevant(),
			required: spec.required,
		};
	};

	it.each(initialStateSpecs)(
		'creates engine state with the values from its input: %j',
		(stateSpec) => {
			rootScope.runTask(() => {
				expect.assertions(1);

				reactiveTestScope(({ mutable }) => {
					const initialState = getCurrentState(stateSpec);
					const state = createSharedNodeState(rootScope, stateSpec, {
						clientStateFactory: mutable,
					});

					expect(state.engineState).toEqual(initialState);
				});
			});
		}
	);

	it.each(initialStateSpecs)(
		'creates client state with the values from its input: %j',
		(stateSpec) => {
			expect.assertions(1);

			rootScope.runTask(() => {
				reactiveTestScope(({ mutable }) => {
					const initialState = getCurrentState(stateSpec);
					const state = createSharedNodeState(rootScope, stateSpec, {
						clientStateFactory: mutable,
					});

					expect(state.clientState).toEqual(initialState);
				});
			});
		}
	);

	it.each(initialStateSpecs)(
		'creates current (client-facing, read-only) state with the values from its input: %j',
		(stateSpec) => {
			expect.assertions(1);

			rootScope.runTask(() => {
				reactiveTestScope(({ mutable }) => {
					const initialState = getCurrentState(stateSpec);
					const state = createSharedNodeState(rootScope, stateSpec, {
						clientStateFactory: mutable,
					});

					expect(state.currentState).toEqual(initialState);
				});
			});
		}
	);

	it('stores property value updates on the engine state', () => {
		expect.assertions(3);

		rootScope.runTask(() => {
			reactiveTestScope(({ mutable }) => {
				const state = createSharedNodeState(
					rootScope,
					{
						readonly: createSignal(false),
						relevant: createSignal(false),
						required: createSignal(false),
					},
					{
						clientStateFactory: mutable,
					}
				);

				state.setProperty('readonly', true);

				expect(state.engineState).toEqual({
					readonly: true,
					relevant: false,
					required: false,
				});

				state.setProperty('relevant', true);

				expect(state.engineState).toEqual({
					readonly: true,
					relevant: true,
					required: false,
				});

				state.setProperty('required', true);

				expect(state.engineState).toEqual({
					readonly: true,
					relevant: true,
					required: true,
				});
			});
		});
	});

	it.each([{ stateKey: 'clientState' }, { stateKey: 'currentState' }] as const)(
		'reflects property value updates to $stateKey',
		({ stateKey }) => {
			expect.assertions(3);

			rootScope.runTask(() => {
				reactiveTestScope(({ mutable }) => {
					const state = createSharedNodeState(
						rootScope,
						{
							readonly: createSignal(false),
							relevant: createSignal(false),
							required: createSignal(false),
						},
						{
							clientStateFactory: mutable,
						}
					);

					state.setProperty('readonly', true);

					expect(state[stateKey]).toEqual({
						readonly: true,
						relevant: false,
						required: false,
					});

					state.setProperty('relevant', true);

					expect(state[stateKey]).toEqual({
						readonly: true,
						relevant: true,
						required: false,
					});

					state.setProperty('required', true);

					expect(state[stateKey]).toEqual({
						readonly: true,
						relevant: true,
						required: true,
					});
				});
			});
		}
	);

	// While this is presently discouraged, we want to test that it's possible in
	// case we find the update mechanism lacking or superfluous.
	it.each([{ stateKey: 'clientState' }, { stateKey: 'currentState' }] as const)(
		'reflects direct mutations of engine state properties to $stateKey',
		({ stateKey }) => {
			expect.assertions(3);

			rootScope.runTask(() => {
				reactiveTestScope(({ mutable }) => {
					const state = createSharedNodeState(
						rootScope,
						{
							readonly: createSignal(false),
							relevant: createSignal(false),
							required: createSignal(false),
						},
						{
							clientStateFactory: mutable,
						}
					);

					state.engineState.readonly = true;

					expect(state[stateKey]).toEqual({
						readonly: true,
						relevant: false,
						required: false,
					});

					state.engineState.relevant = true;

					expect(state[stateKey]).toEqual({
						readonly: true,
						relevant: true,
						required: false,
					});

					state.engineState.required = true;

					expect(state[stateKey]).toEqual({
						readonly: true,
						relevant: true,
						required: true,
					});
				});
			});
		}
	);

	describe('mutable properties', () => {
		it("assigns mutable state to a property's backing signal", () => {
			expect.assertions(4);

			rootScope.runTask(() => {
				reactiveTestScope(({ mutable }) => {
					const readonly = createSignal(false);
					const [getReadonly] = readonly;

					const state = createSharedNodeState(
						rootScope,
						{
							readonly,
							relevant: false,
							required: true,
						},
						{
							clientStateFactory: mutable,
						}
					);

					expect(getReadonly()).toBe(false);
					expect(state.engineState.readonly).toBe(false);

					state.setProperty('readonly', true);

					expect(getReadonly()).toBe(true);
					expect(state.engineState.readonly).toBe(true);
				});
			});
		});

		it("mutates the state's backing signal by mutating the engine state property directly", () => {
			expect.assertions(4);

			rootScope.runTask(() => {
				reactiveTestScope(({ mutable }) => {
					const readonly = createSignal(false);
					const [getReadonly] = readonly;

					const state = createSharedNodeState(
						rootScope,
						{
							readonly,
							relevant: false,
							required: true,
						},
						{
							clientStateFactory: mutable,
						}
					);

					expect(getReadonly()).toBe(false);
					expect(state.engineState.readonly).toBe(false);

					state.engineState.readonly = true;

					expect(getReadonly()).toBe(true);
					expect(state.engineState.readonly).toBe(true);
				});
			});
		});
	});

	describe('accessors', () => {
		it.each([{ stateKey: 'clientState' }, { stateKey: 'currentState' }] as const)(
			'reflects computed read-only to $stateKey when the computation updates',
			({ stateKey }) => {
				expect.assertions(2);

				rootScope.runTask(() => {
					reactiveTestScope(({ mutable }) => {
						const [booleanInt, setBooleanInt] = createSignal<0 | 1>(0);
						const isReadonly = createMemo(() => booleanInt() === 1);

						const state = createSharedNodeState(
							rootScope,
							{
								readonly: isReadonly,
								relevant: false,
								required: true,
							},
							{
								clientStateFactory: mutable,
							}
						);

						expect(state[stateKey].readonly).toBe(false);

						setBooleanInt(1);

						expect(state[stateKey].readonly).toBe(true);
					});
				});
			}
		);

		it('prevents writes to computed properties', () => {
			expect.assertions(7);

			rootScope.runTask(() => {
				reactiveTestScope(({ mutable }) => {
					const readonly = createMemo(() => true);

					const state = createSharedNodeState(
						rootScope,
						{
							readonly,
							relevant: false,
							required: true,
						},
						{
							clientStateFactory: mutable,
						}
					);

					expect(state.engineState.readonly).toBe(true);
					expect(state.clientState.readonly).toBe(true);
					expect(state.currentState.readonly).toBe(true);

					try {
						// @ts-expect-error - `readonly` property is not mutable
						state.setProperty('readonly', false);
						expect.fail();
					} catch (error) {
						expect(error).toBeInstanceOf(TypeError);
					}

					expect(state.engineState.readonly).toBe(true);
					expect(state.clientState.readonly).toBe(true);
					expect(state.currentState.readonly).toBe(true);
				});
			});
		});
	});

	describe('engine reactivity', () => {
		interface ObservedStates {
			readonly readonly: boolean[];
			readonly relevant: boolean[];
			readonly required: boolean[];
		}

		// Note "as they occur" is a bit more nuanced than one might expect. By
		// default, Solid's effects are batched. We use `createComputed` to *fully
		// synchronously* observe each change as it occurs.
		it('triggers reactive effects in the engine as state changes occur', () => {
			expect.assertions(5);

			rootScope.runTask(() => {
				reactiveTestScope(({ mutable }) => {
					const state = createSharedNodeState(
						rootScope,
						{
							readonly: createSignal(false),
							relevant: createSignal(false),
							required: createSignal(false),
						},
						{
							clientStateFactory: mutable,
						}
					);

					// Destructured here so these aren't nullish in callbacks (since
					// `state` itself is nullable)
					const { engineState, setProperty } = state;

					rootScope.runTask(() => {
						const observedStates: ObservedStates = {
							readonly: [],
							relevant: [],
							required: [],
						};

						createComputed(() => {
							observedStates.readonly.push(engineState.readonly);
						});

						createComputed(() => {
							observedStates.relevant.push(engineState.relevant);
						});

						createComputed(() => {
							observedStates.required.push(engineState.required);
						});

						expect(observedStates).toEqual({
							readonly: [false],
							relevant: [false],
							required: [false],
						});

						setProperty('readonly', true);

						expect(observedStates).toEqual({
							readonly: [false, true],
							relevant: [false],
							required: [false],
						});

						setProperty('required', true);

						expect(observedStates).toEqual({
							readonly: [false, true],
							relevant: [false],
							required: [false, true],
						});

						setProperty('readonly', false);

						expect(observedStates).toEqual({
							readonly: [false, true, false],
							relevant: [false],
							required: [false, true],
						});

						setProperty('relevant', true);

						expect(observedStates).toEqual({
							readonly: [false, true, false],
							relevant: [false, true],
							required: [false, true],
						});
					});
				});
			});
		});
	});

	describe.each([{ stateKey: 'clientState' }, { stateKey: 'currentState' }] as const)(
		'client reactivity ($stateKey)',
		({ stateKey }) => {
			interface ObservedStates {
				readonly readonly: boolean[];
				readonly relevant: boolean[];
				readonly required: boolean[];
			}

			// Note "as they occur" is a bit more nuanced than one might expect. By
			// default, Solid's effects are batched. We use `createComputed` to *fully
			// synchronously* observe each change as it occurs.
			it('triggers reactive effects in the engine as state changes occur', () => {
				expect.assertions(5);

				rootScope.runTask(() => {
					reactiveTestScope(({ mutable, effect }) => {
						const state = createSharedNodeState(
							rootScope,
							{
								readonly: createSignal(false),
								relevant: createSignal(false),
								required: createSignal(false),
							},
							{
								clientStateFactory: mutable,
							}
						);

						// Destructured here so these aren't nullish in callbacks (since
						// `state` itself is nullable)
						const { setProperty } = state;
						const observedState = state[stateKey];

						rootScope.runTask(() => {
							const observedStates: ObservedStates = {
								readonly: [],
								relevant: [],
								required: [],
							};

							effect(() => {
								observedStates.readonly.push(observedState.readonly);
							});

							effect(() => {
								observedStates.relevant.push(observedState.relevant);
							});

							effect(() => {
								observedStates.required.push(observedState.required);
							});

							expect(observedStates).toEqual({
								readonly: [false],
								relevant: [false],
								required: [false],
							});

							setProperty('readonly', true);

							expect(observedStates).toEqual({
								readonly: [false, true],
								relevant: [false],
								required: [false],
							});

							setProperty('required', true);

							expect(observedStates).toEqual({
								readonly: [false, true],
								relevant: [false],
								required: [false, true],
							});

							setProperty('readonly', false);

							expect(observedStates).toEqual({
								readonly: [false, true, false],
								relevant: [false],
								required: [false, true],
							});

							setProperty('relevant', true);

							expect(observedStates).toEqual({
								readonly: [false, true, false],
								relevant: [false, true],
								required: [false, true],
							});
						});
					});
				});
			});
		}
	);
});
