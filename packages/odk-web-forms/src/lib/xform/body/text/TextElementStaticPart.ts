import type { TextElementPart } from './TextElementPart.ts';

export class TextElementStaticPart implements TextElementPart {
	readonly dependencyExpressions: readonly string[] = [];
	protected readonly textContent: string;

	constructor(node: Element | Text) {
		this.textContent = node.textContent ?? '';
	}

	evaluate(): string {
		return this.textContent;
	}
}
