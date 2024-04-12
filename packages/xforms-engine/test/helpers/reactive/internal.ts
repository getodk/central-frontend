/**
 * @module - Provides a reactivity implementation with the minimal functionality
 * needed for satisfying **and testing** the engine's use of
 * {@link OpaqueReactiveObjectFactory}.
 *
 * The implementation is partially based on
 * {@link https://dev.to/ryansolid/building-a-reactive-library-from-scratch-1i0p},
 * a reactive internals tutorial by the creator of Solid. As such, it bears some
 * resemblance to the internal design of Solid's own reactive primitives. But it
 * intentionally differs in a few ways:
 *
 * - It doesn't expose a reactive atomic value primitive (e.g. a "signal"), as
 *   we don't use this in our engine/client interface.
 *
 * - That primitive is used to compose others internally, however. Its internal
 *   shape is slightly different, but it preserves Solid's intentional
 *   read/write segregation design. (Not that it matters from the outside, but
 *   it should help with reasoning about the internal compositions.)
 *
 * - The primitives it does expose have slightly different names. This is mostly
 *   to avoid confusion if/where these APIs might coexist with Solid's APIs in
 *   the same module, and to avoid auto-import mistakes so long as we continue
 *   to use Solid for internal reactivity concerns.
 *
 * @todo it's entirely possible this limited reactive API is (or becomes)
 * actually suitable for engine-internal use cases, and we might consider
 * dropping dependencies for such internal use.
 */

import type { OpaqueReactiveObjectFactory } from '../../../src/client/OpaqueReactiveObjectFactory.ts';

type Thunk<T> = () => T;

/**
 * Defines a thunk producing a computed value, which may be produced from one or
 * more reactive values. Like an {@link AtomicState} value, calling this thunk
 * in a reactive context (like an {@link effect}) acts as a subscription; writes
 * to any underlying reactive values used in this computation also trigger
 * reactive updates where this thunk is called.
 *
 * @todo This is closely related to what Solid calls a "memo", but there is
 * presently no memoization mechanism in place to restrict downstream reactions.
 * But it does utilize {@link AtomicState} as an intermediate store, so we'd get
 * some notion of memoization here "for free" if we did elect to implement
 * "updated value" checking logic there.
 */
export type DefineComputation = <T>(computeFn: Thunk<T>) => Thunk<T>;

/**
 * Defines a reactive subscription context. Runs immediately upon definition.
 * Reading reactive values within `effectFn` establishes a subscription, causing
 * `effectFn` to be re-run for writes to those reactive values.
 *
 * @todo effects may run more frequently than we'd prefer in real world usage,
 * both due to reasoning discussed in {@link Write} and because there is
 * currently no batching mechanism for multiple synchronous writes. As such (and
 * despite what the name might imply), the current `effect` implementation most
 * closely resembles Solid's
 * {@link https://docs.solidjs.com/reference/secondary-primitives/create-computed | `createComputed`}.
 */
export type DefineEffect = (effectFn: VoidFunction) => void;

export type DefineMutableObject = <T extends object>(object: T) => T;

/**
 * A reactive scope isolating reactive subscriptions within a
 * {@link ReactiveTestScopeCallback}.
 *
 * This is roughly a subset of Solid's concept of a
 * {@link https://www.solidjs.com/docs/latest/api#createroot | reactive root},
 * with these limitations/distinctions:
 *
 * - Nesting is not supported
 * - Contexts cannot be referenced
 * - Disposal is implicit when the callback exits\*
 * - Each reactive primitive is inherently bound to the context of the {@link ReactiveTestContextCallback}; this API is intentionally non-global.
 *
 * @todo \* Disposal is _so implicit_ that nothing is actually done to clean
 * anything up. Since we're initially targeting use in tests, we can generally
 * just rely on the GC where it's effective, ignore memory leaks as ephemeral,
 * and generally try to avoid exposing reactive stuff outside the reactive test
 * scope's callback (e.g. either with outer scope bindings, or the reactive
 * scope's own return value). Importantly, since there's no explicit disposal
 * mechanism, we should be careful with any async/timer logic within a reactive
 * test scope.
 */
export interface ReactiveTestScope {
	readonly mutable: DefineMutableObject;
	readonly computed: DefineComputation;
	readonly effect: DefineEffect;
}

/**
 * An arbitrary function which is executed with a {@link ReactiveTestScope}.
 * Since this reactive implementation is presently targeted for test use cases,
 * it's anticipated that the callback will be either used to perform a test's
 * logic directly, or to perform some subset of that test logic like setup.
 *
 * The function may return a value of any type, which will in turn be returned
 * from {@link reactiveTestScope} where it is called. As discussed in
 * {@link ReactiveTestScope}, care should be taken not to break the scope of
 * reactivity itself.
 */
type ReactiveTestScopeCallback<T> = (context: ReactiveTestScope) => T;

/**
 * Runs an arbitrary {@link ReactiveTestContextCallback} within a
 * {@link ReactiveTestScope}, and returns the callback's value. See docs for
 * both for additional detail and considerations.
 */
export const reactiveTestScope = <Result>(callback: ReactiveTestScopeCallback<Result>): Result => {
	interface Dependency {
		readonly subscribers: Set<Subscriber>;
	}

	interface Subscriber {
		readonly execute: VoidFunction;
		readonly dependencies: Set<Dependency>;
	}

	const subscribers: Subscriber[] = [];

	/**
	 * A thunk which produces a (potentially) reactive value when called, and which
	 * establishes a subscription when called within a reactive context.
	 */
	type ReadAtom<T> = Thunk<T>;

	/**
	 * A function used to update an atomic reactive value, and which updates
	 * reactive subscriptions when called with an updated value.
	 *
	 * @todo "updated value" is not currently checked
	 * @todo we don't currently accept a callback with the current value, but it
	 * might be a good idea if we expand usage
	 */
	type WriteAtom<T> = (value: T) => T;

	/**
	 * Provides both read and write access to an atomic reactive value (e.g. a
	 * "signal"). Note that this is not the interface for mutables.
	 */
	interface Atom<T> {
		readonly read: ReadAtom<T>;
		readonly write: WriteAtom<T>;
	}

	/**
	 * Produces an atomic reactive value (e.g. a "signal").
	 */
	type DefineAtom = <T>(initialValue: T) => Atom<T>;

	const cleanupSubscriber = (running: Subscriber) => {
		const { dependencies } = running;

		for (const dependency of dependencies) {
			dependency.subscribers.delete(running);
		}

		dependencies.clear();
	};

	class AtomicState<T> implements Atom<T>, Dependency {
		readonly read: ReadAtom<T>;
		readonly write: WriteAtom<T>;
		readonly subscribers = new Set<Subscriber>();

		constructor(value: T) {
			this.read = (): T => {
				const running = subscribers[subscribers.length - 1];

				if (running) {
					this.subscribers.add(running);

					running.dependencies.add(this);
				}

				return value;
			};

			this.write = (nextValue: T) => {
				/**
				 * @see {@link WriteAtom}, this is likely where we'd think about checking
				 * whether a value change has actually occurred to determine whether
				 * any subscriptions should be notified.
				 */
				value = nextValue;

				for (const subscriber of [...this.subscribers]) {
					subscriber.execute();
				}

				return value;
			};
		}
	}

	const atom: DefineAtom = (value) => {
		return new AtomicState(value);
	};

	const computed: DefineComputation = <T>(fn: Thunk<T>): Thunk<T> => {
		const { read, write } = atom<T>(undefined!);

		effect(() => write(fn()));

		return read;
	};

	const effect: DefineEffect = (effectFn: VoidFunction) => {
		const execute = () => {
			cleanupSubscriber(running);

			subscribers.push(running);

			try {
				effectFn();
			} finally {
				subscribers.pop();
			}
		};

		const running: Subscriber = {
			execute,
			dependencies: new Set(),
		};

		execute();
	};

	const mutable = <T extends object>(object: T): T => {
		// Creating a null-property object ensures we're *only* creating reactive
		// properties for the explicitly defined members of the input object.
		const reactiveObject = Object.create(null) as T;

		// Map each "normal" (read/writable) property to a computed get/set property
		// backed by an Atom. For other properties:
		//
		// - Existing computed properties are preserved exactly as they're defined.
		// - Inherited (e.g. by prototype/class extension) properties are omitted.
		Object.entries(Object.getOwnPropertyDescriptors(object)).forEach(([key, inputDescriptor]) => {
			if (inputDescriptor.writable) {
				const { read, write } = atom(inputDescriptor.value);

				Object.defineProperty(reactiveObject, key, {
					configurable: false,
					enumerable: true,
					get: read,
					set: write,
				});
			} else {
				Object.defineProperty(reactiveObject, key, inputDescriptor);
			}
		});

		return reactiveObject;
	};

	// Having now established the API available to the reactive scope, we execute
	// the provided callback with that API. We would likely perform any cleanup
	// after this call.
	const result = callback({
		mutable,
		computed,
		effect,
	});

	return result;
};
