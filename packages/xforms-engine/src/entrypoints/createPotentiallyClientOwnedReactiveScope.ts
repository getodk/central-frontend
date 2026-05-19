import { getOwner, type Owner } from 'solid-js';
import { createReactiveScope, type ReactiveScope } from '../lib/reactivity/scope';

/**
 * Creates a {@link ReactiveScope | reactive scope} from which all form
 * instances derive, and:
 *
 * - if a client loads a form within a Solid reactive context, the scope will be
 *   disposed along with the client's reactive context; OR
 * - if a client loads a form outside a Solid reactive context (typically: if a
 *   client does not use Solid reactivity), the scope will disposed if and when
 *   the engine drops access to the loaded form
 *
 * **IMPORTANT:** this **MUST** be called synchronously. If it is called in an
 * `async` function, it **MUST** be called before any `await` expression; if it
 * is called in any other flow with mixed synchrony, it must be called before
 * yielding to the event loop. Failing to do this will cause the engine to lose
 * access to a client's Solid reactive context, potentially leaking form
 * reactivity indefinitely.
 */
export const createPotentiallyClientOwnedReactiveScope = (): ReactiveScope => {
	/**
	 * A {@link clientOwner | client owner} is the owner of a client's Solid
	 * reactive context, if one exists. If none exists, the {@link ReactiveScope}
	 * is fully owned by the engine.
	 */
	const clientOwner: Owner | null = getOwner();

	return createReactiveScope({ owner: clientOwner });
};
