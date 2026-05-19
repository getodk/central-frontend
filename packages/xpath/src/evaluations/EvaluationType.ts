import type { XPathNode } from '../adapter/interface/XPathNode.ts';

export interface EvaluationTypes<T extends XPathNode> {
	readonly BOOLEAN: boolean;
	readonly NODE: T;
	readonly NUMBER: number;
	readonly STRING: string;
}

export type PrimitiveEvaluationType = 'BOOLEAN' | 'NUMBER' | 'STRING';

export type EvaluationType = PrimitiveEvaluationType | 'NODE';
