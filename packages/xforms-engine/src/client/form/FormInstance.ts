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

/**
 * Represents an instance which:
 *
 * - was previously serialized
 * - was **submitted**, often referred to as a "submission" (noun)
 * - is being initialized to produce an edited instance of that "submission"
 *
 * An edited instance may be populated from one or more network-accessible
 * resources—its serialized instance XML, and any _instance attachments_—which
 * are resolved in a manner similar to that of a form definition and its _form
 * attachments_.
 *
 * Once resolved, an edited instance is restored from its previously filled
 * state _as it was submitted_, consistent with
 * {@link FormInstanceRestoreMode | restoring an instance}, with the following
 * exceptions:
 *
 * - If the form or instance does not define an explicit
 *   {@link https://getodk.github.io/xforms-spec/#metadata | `deprecatedID` metadata element},
 *   one will be created.
 *
 * - If the instance has an `instanceID` metadata element, that element's value
 *   will be assigned to the instance's `deprecatedID`.
 *
 * - If applicable, a new instance id will be assigned:
 *
 *     - If the instance has an `instanceID` metadata element, and the form
 *       explicitly defines a
 *       {@link https://getodk.github.io/xforms-spec/#preload-attributes | `uid` preload attribute}
 *       for its model binding, a new instance id value will be assigned to that
 *       element _as if it were the
 *       {@link https://getodk.github.io/xforms-spec/#event:odk-instance-first-load | instance's first load}_.
 *
 *     - **Consistent with {@link FormInstanceCreateMode | instance creation}:**
 *       if the form **DOES NOT** define an `instanceID` element or model
 *       binding, the `uid` preload behavior described above is **implied** as
 *       the form's default behavior for that metadata; in which case whether
 *       the instance defines an `instanceID` element explicitly or not, it will
 *       be treated as if it had, behaving as described in the point above.
 *
 * **NOTE:** the behavior for an instance's `instanceID` metadata element and a
 * form's `uid` preload attribute describe a special case, applying only to that
 * specific preload attribute. In other words, when initializing instance state
 * for editing:
 *
 * - The `odk-instance-first-load` event itself will **NOT** be triggered
 * - Preload attributes _other than `uid`_ will **NOT** be recomputed
 *
 * **NOTE:** while the `uid` preload attribute is discussed above in terms of
 * the `instanceID` meta element, its behavior is not applied specially to any
 * particular node, regardless of
 * {@link FormInstanceInitializationMode | initialization mode}.
 */
export type FormInstanceEditMode = 'edit';

// prettier-ignore
export type FormInstanceInitializationMode =
	| FormInstanceCreateMode
	| FormInstanceEditMode
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

export type AnyFormInstance = {
	[Mode in FormInstanceInitializationMode]: FormInstance<Mode>;
}[FormInstanceInitializationMode];
