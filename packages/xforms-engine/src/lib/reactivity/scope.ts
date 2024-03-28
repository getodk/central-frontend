import type { Owner } from 'solid-js';
import { runWithOwner as baseRunWithOwner, createRoot, getOwner } from 'solid-js';

type ReactiveScopeTask<T> = (scope: ReactiveScope) => T;

type RunReactiveScopeTask = <T>(task: ReactiveScopeTask<T>) => T;

export interface ReactiveScope {
	readonly owner: Owner;
	readonly dispose: VoidFunction;
	readonly runTask: RunReactiveScopeTask;
}

interface CreateReactiveScopeOptions {
	readonly owner?: Owner | null;
}

/**
 * Default types for these pertinent reactive scope APIs as produced by Solid.
 * These types are correct, but only so restrictive to account for their
 * behavior outside of a reactive root.
 */
interface UnknownReactiveScopeAPI {
	/**
	 * The type returned by Solid's {@link getOwner}. It will always produce
	 * `Owner` when called in a reactive scope (created by {@link createRoot}).
	 */
	readonly owner: Owner | null;

	/**
	 * The unmodified type of Solid's {@link baseRunWithOwner | runWithOwner}.
	 * It will return {@link T} when {@link owner} is not `null`.
	 */
	readonly runWithOwner: <T>(owner: Owner | null, fn: () => T) => T | undefined;
}

/**
 * Refined types for the same reactive APIs as {@link UnknownReactiveScopeAPI},
 * where their less restricted behavior is known when run within a reactive
 * scope (via {@link createRoot}).
 */
interface ValidatedReactiveScopeAPI {
	readonly owner: Owner;
	readonly runWithOwner: <T>(owner: Owner, fn: () => T) => T;
}

/**
 * @see {@link UnknownReactiveScopeAPI} and {@link ValidatedReactiveScopeAPI}
 */
const validateReactiveScopeAPI = (api: UnknownReactiveScopeAPI): ValidatedReactiveScopeAPI => {
	if (api.owner == null) {
		throw new Error('Must be run in a reactive scope');
	}

	return api as ValidatedReactiveScopeAPI;
};

/**
 * Creates a reactive scope for internal engine use. This currently uses Solid's
 * implementation of reactivity, and makes no attempt to obscure that. As such,
 * all of the terms and types exposed are intentionally direct references to
 * their concepts in Solid.
 *
 * This reactive scope is suitable for isolating reactivity between tests. It is
 * also suitable for scoping reactivity for nodes in engine/client state, as
 * well as creating nested scopes for their descendants.
 */
export const createReactiveScope = (options: CreateReactiveScopeOptions = {}): ReactiveScope => {
	return createRoot((baseDispose) => {
		let isDisposed = false;

		const dispose: VoidFunction = () => {
			if (isDisposed) {
				throw new Error('Cannot dispose reactive scope multiple times');
			}

			baseDispose();
			isDisposed = true;
		};

		const { owner, runWithOwner } = validateReactiveScopeAPI({
			owner: getOwner(),
			runWithOwner: baseRunWithOwner,
		});

		const runTask = <T>(task: ReactiveScopeTask<T>): T => {
			if (isDisposed) {
				throw new Error('Cannot run reactive task in reactive scope after it has been disposed');
			}

			return runWithOwner(owner, () => {
				return task({
					dispose,
					owner,
					runTask,
				});
			});
		};

		return {
			dispose,
			owner,
			runTask,
		};
	}, options.owner ?? getOwner());
};
