import type { RootNode } from '../RootNode.ts';
import type { InstantiableLoadFormResult, LoadFormResult } from './LoadFormResult.ts';

/**
 * Represents an instance which is newly created from a form definition.
 *
 * A newly created instance is populated with default values and state defined
 * by the form.
 *
 * Computations are performed on initialization as specified by
 * {@link https://getodk.github.io/xforms-spec/ | ODK XForms}, as the instance's
 * {@link https://getodk.github.io/xforms-spec/#event:odk-instance-first-load | first load}.
 */
export type FormInstanceCreateMode = 'create';

/**
 * Represents an instance restored from previously filled state, as represented
 * in an {@link InstancePayload}. Clients may serialize and persist an instance
 * payload as appropriate for their use cases, and can restore the instance with
 * a partial instance payload structure, defined by the
 * {@link RestoreFormInstanceInput} interface.
 *
 * A restored instance is populated by the engine with the answers as they had
 * been filled at the time the {@link InstancePayload}
 * ({@link RestoreFormInstanceInput}) was created.
 *
 * Computations are performed on initialization as specified by
 * {@link https://getodk.github.io/xforms-spec/#event:odk-instance-load | ODK XForms},
 * as a
 * {@link https://getodk.github.io/xforms-spec/#event:odk-instance-load | subsequent load}
 * (i.e. **NOT** "first load", as is the case with newly
 * {@link FormInstanceCreateMode | created} instances}) of the instance.
 */
export type FormInstanceRestoreMode = 'restore';

// prettier-ignore
export type FormInstanceInitializationMode =
	| FormInstanceCreateMode
	| FormInstanceRestoreMode;

/**
 * @todo this could hypothetically convey warnings and/or errors, just as
 * {@link LoadFormResult} does. This has been deferred because:
 *
 * - We really want a more thoughtful design for Result types
 * - The `try`/`catch` approach to capturing all errors takes a huge performance
 *   hit, which we should not incur if we have a more thoughtful design coming
 *   eventually. It would be too easy to forget about, indefinitely!
 */
export interface FormInstance<Mode extends FormInstanceInitializationMode> {
	readonly formResult: InstantiableLoadFormResult;
	readonly mode: Mode;
	readonly root: RootNode;
}
