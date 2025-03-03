import type { NoteRuntimeValue } from '../lib/codecs/NoteCodec.ts';
import type { InputControlDefinition } from '../parse/body/control/InputControlDefinition.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseValueNode, BaseValueNodeState } from './BaseValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { NodeAppearances } from './NodeAppearances.ts';
import type { RootNode } from './RootNode.ts';
import type { TextRange } from './TextRange.ts';
import type { LeafNodeValidationState } from './validation.ts';
import type { ValueType } from './ValueType.ts';

export type NoteValue<V extends ValueType> = NoteRuntimeValue<V>;

export interface NoteNodeState<V extends ValueType> extends BaseValueNodeState<NoteValue<V>> {
	/**
	 * Note-specific specialization: a note will always have a non-null value in
	 * at least one of:
	 *
	 * - {@link label}
	 * - {@link hint}
	 *
	 * This is an alias to whichever is present, with precedent to {@link label}
	 * if both are present.
	 */
	// ^ @todo While it's possible to convey this at the type level, the resulting
	// types would be far more complex than this, which is not ideal especially at
	// the package (client) boundary. This alias is a concession that the simpler
	// type is preferred, but that it is still important to convey to clients
	// that at least one form-defined text value will always be available. Note:
	// at least for a first pass, we won't guarantee that the resulting text is
	// non-empty. (We'd probably need to accept an engine fallback to make that
	// guarantee; otherwise we'd need to error on invalid state, potentially at
	// arbitrary points in time.)
	//
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	get noteText(): NonNullable<this['label'] | this['hint']>;

	/**
	 * A note will **always** be `readonly`.
	 */
	readonly readonly: true;

	get label(): TextRange<'label', 'form'> | null;
	get hint(): TextRange<'hint', 'form'> | null;
	get children(): null;
	get valueOptions(): null;

	/**
	 * Reflects the readonly value of a {@link NoteNode}, or `null` if blank.
	 */
	// Note that being nullable is an intentional deviation from most other value
	// node types, specifically to make a clear distinction between blank and
	// non-blank values (as that has been a primary driver for prioritizing note
	// functionality).
	get value(): NoteValue<V>;
}

export interface NoteDefinition<V extends ValueType = ValueType> extends LeafNodeDefinition<V> {
	readonly bodyElement: InputControlDefinition;
}

export type NoteNodeAppearances = NodeAppearances<NoteDefinition>;

/**
 * A node which is:
 *
 * - associated with an input, with at least one text element (label or hint)
 * - guaranteed to be {@link NoteNodeState.readonly | readonly}
 */
export interface NoteNode<V extends ValueType = ValueType> extends BaseValueNode<V, NoteValue<V>> {
	readonly nodeType: 'note';
	readonly appearances: NoteNodeAppearances;
	readonly nodeOptions: null;
	readonly definition: NoteDefinition<V>;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: NoteNodeState<V>;
	readonly validationState: LeafNodeValidationState;
}

export type StringNoteValue = NoteValue<'string'>;
export type IntNoteValue = NoteValue<'int'>;
export type DecimalNoteValue = NoteValue<'decimal'>;
export type GeopointNoteValue = NoteValue<'geopoint'>;

export type StringNoteNode = NoteNode<'string'>;
export type IntNoteNode = NoteNode<'int'>;
export type DecimalNoteNode = NoteNode<'decimal'>;
export type GeopointNoteNode = NoteNode<'geopoint'>;

// prettier-ignore
type SupportedNoteValueType =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'string'
	| 'int'
	| 'decimal'
	| 'geopoint';

type TemporaryStringValueType = Exclude<ValueType, SupportedNoteValueType>;

export type TemporaryStringValueNoteNode = NoteNode<TemporaryStringValueType>;

// prettier-ignore
export type AnyNoteNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| StringNoteNode
	| IntNoteNode
	| DecimalNoteNode
	| GeopointNoteNode
	| TemporaryStringValueNoteNode;
