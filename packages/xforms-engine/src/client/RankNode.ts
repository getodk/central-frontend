import type { RankControlDefinition } from '../parse/body/control/RankControlDefinition.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseValueNode, BaseValueNodeState } from './BaseValueNode.ts';
import type { RootNode } from './RootNode.ts';
import type { TextRange } from './TextRange.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { LeafNodeValidationState } from './validation.ts';
import type { UnknownAppearanceDefinition } from '../parse/body/appearance/unknownAppearanceParser.ts';
import type { ValueType } from './ValueType.ts';

export interface RankItem {
	get label(): TextRange<'item-label'>;
	get value(): string;
}

export type RankValueOptions = readonly RankItem[];

export interface RankNodeState extends BaseValueNodeState<readonly string[]> {
	get valueOptions(): RankValueOptions;

	/**
	 * An ordered collection of values from {@link RankItem}.
	 * The order of the items is important and must be preserved during processing.
	 */
	get value(): readonly string[];
}

export interface RankDefinition<V extends ValueType = ValueType> extends LeafNodeDefinition<V> {
	readonly bodyElement: RankControlDefinition;
}

export interface RankNode extends BaseValueNode<'string', readonly string[]> {
	readonly nodeType: 'rank';
	readonly appearances: UnknownAppearanceDefinition;
	readonly nodeOptions: null;
	readonly valueType: 'string';
	readonly definition: RankDefinition<'string'>;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: RankNodeState;
	readonly validationState: LeafNodeValidationState;

	/**
	 * Convenience API to get the {@link RankItem}'s label.
	 */
	getValueLabel(value: string): TextRange<'item-label'> | null;

	/**
	 * Set the value which is an ordered collection of values from {@link RankItem}.
	 * Calling this setter replaces the currently value.
	 * If called with an empty array, the current is cleared.
	 */
	setValues(values: readonly string[]): RootNode;
}
