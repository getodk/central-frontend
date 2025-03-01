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
 * @todo Other modes incoming!
 */
// prettier-ignore
export type FormInstanceInitializationMode =
	| FormInstanceCreateMode;

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
