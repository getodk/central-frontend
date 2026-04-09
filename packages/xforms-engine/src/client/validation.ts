import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { FormNodeID } from './identity.ts';
import type { OpaqueReactiveObjectFactory } from './OpaqueReactiveObjectFactory.ts';
import type { RootNode } from './RootNode.ts';
import type { TextRange } from './TextRange.ts';

// This interface exists so that extensions can share JSDoc for `valid`.
interface BaseValidity {
	/**
	 * Specifies the unambiguous validity state for each validity condition of a
	 * given node, or for the derived validity of any parent node whose descendants
	 * are validated.
	 *
	 * For {@link ValidationCondition | form-defined conditions}, validity is
	 * determined as follows:
	 *
	 *
	 *   expression | state     |  blank  | non-blank
	 * ------------:|:----------|:-------:|:---------:
	 * `constraint` | `true`\*  | ✅      | ✅
	 * `constraint` | `false`   | ✅      | ❌
	 * `required`   | `false`\* | ✅      | ✅
	 * `required`   | `true`    | ❌      | ✅
	 *
	 * - \* = default (expression not defined)
	 * - ✅ = `valid: true`
	 * - ❌ = `valid: false`
	 */
	readonly valid: boolean;
}

/**
 * Form-defined conditions which determine node validity.
 *
 * @see {@link https://getodk.github.io/xforms-spec/#bind-attributes | `constraint` and `required` bind attributes}
 */
export type ValidationCondition = 'constraint' | 'required';

interface ValidationConditionMessageRoles {
	readonly constraint: 'constraintMsg';
	readonly required: 'requiredMsg';
}

export type ValidationConditionMessageRole<Condition extends ValidationCondition> =
	ValidationConditionMessageRoles[Condition];

/**
 * A form-defined violation message, present when the form designer specified `jr:constraintMsg`
 * or `jr:requiredMsg`. The text may be translated ({@link https://getodk.github.io/xforms-spec/#fn:jr:itext | `jr:itext`})
 * and dynamic (via {@link https://getodk.github.io/xforms-spec/#body-elements | `<output>`}).
 *
 * When absent, {@link ConditionViolation.message} is `null` and clients are expected to provide
 * their own default messaging (e.g. a translated fallback).
 */
export interface ViolationMessage<Condition extends ValidationCondition> extends TextRange<
	ValidationConditionMessageRole<Condition>
> {
	get asString(): string;
}

export interface ConditionSatisfied<Condition extends ValidationCondition> extends BaseValidity {
	readonly condition: Condition;
	readonly valid: true;
	readonly message: null;
}

export interface ConditionViolation<Condition extends ValidationCondition> extends BaseValidity {
	readonly condition: Condition;
	readonly valid: false;
	readonly message: ViolationMessage<Condition> | null;
}

export type ConditionValidation<Condition extends ValidationCondition> =
	| ConditionSatisfied<Condition>
	| ConditionViolation<Condition>;

export type AnyViolation = ConditionViolation<ValidationCondition>;

/**
 * Represents the validation state of a leaf (or value) node.
 *
 * Validity is computed for two conditions:
 *
 * - {@link constraint}: arbitrary form-defined condition which specifies
 *   whether a (non-blank) value is considered valid
 *
 *  - {@link required}: when a node is required, the node must have a non-blank
 *    value to be considered valid
 *
 * Only one of these conditions can be violated (applicability is mutually
 * exclusive). As such, {@link violation} provides a convenient way to determine
 * whether a leaf/value node is valid with a single (null) check.
 *
 * @see {@link BaseValidity.valid} for additional details on how these
 * conditions are evaluated (and how they interact with one another).
 */
export interface LeafNodeValidationState {
	get constraint(): ConditionValidation<'constraint'>;
	get required(): ConditionValidation<'required'>;

	/**
	 * Violations are mutually exclusive:
	 *
	 * - {@link constraint} can only be violated by a non-blank value
	 * - {@link required} can only be violated by a blank value
	 *
	 * As such, at most one violation can be present. If none is present,
	 * the node is considered valid.
	 */
	get violation(): AnyViolation | null;
}

/**
 * Provides a reference to any leaf/value node which currently violates either
 * of its validity conditions.
 *
 * Any client can safely assume:
 *
 * - {@link nodeId} will be a stable reference to a node with the same
 *   {@link BaseNode.nodeId | `nodeId`}.
 *
 * - {@link node} will have reference equality to the same node object, within
 *   the active form instance's {@link RootNode} tree
 *
 * - {@link reference} will be a **current** reference to the same node object's
 *   **computed** {@link BaseNodeState.reference | `currentState.reference`}
 *
 * Any client utilizing the engine's reactive APIs (having provided an
 * {@link OpaqueReactiveObjectFactory}) can safely assume that {@link reference}
 * will be recomputed and updated in tandem with the affected node's own
 * computed `currentState.reference` as well.
 *
 * @todo this type currently exposes multiple ways to reference the affected
 * node. This is intended to maximize flexibility: it's not yet clear how
 * clients will be best served by which reference mechanism. It is expected that
 * each property will be directly computed from the affected node.
 */
export interface DescendantNodeViolationReference {
	readonly nodeId: FormNodeID;

	get reference(): string;
	get violation(): AnyViolation;
}

/**
 * Provides access from any ancestor/parent node, to identify any validity
 * violations present on any of its leaf/value node descendants.
 *
 * @see {@link DescendantNodeViolationReference} for details on how descendants
 * may be referenced when such a violation is present.
 */
export interface AncestorNodeValidationState {
	get violations(): readonly DescendantNodeViolationReference[];
}

/**
 * Convenience interface for nodes that cannot be invalid.
 */
export interface NullValidationState {
	get violations(): readonly [];
}

// prettier-ignore
export type NodeValidationState =
	| AncestorNodeValidationState
	| LeafNodeValidationState
	| NullValidationState;
