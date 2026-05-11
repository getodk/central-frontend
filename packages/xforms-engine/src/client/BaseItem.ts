import type { TextRange } from './TextRange.ts';

export interface BaseItem {
	get label(): TextRange<'item-label'>;
	get value(): string;
	properties: Array<[string, string]>;
}
