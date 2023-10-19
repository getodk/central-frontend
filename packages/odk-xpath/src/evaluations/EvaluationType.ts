export interface EvaluationTypes {
	readonly BOOLEAN: boolean;
	readonly NODE: Node;
	readonly NUMBER: number;
	readonly STRING: string;
}

export type EvaluationType = keyof EvaluationTypes;
