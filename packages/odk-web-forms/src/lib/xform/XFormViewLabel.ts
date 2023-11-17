import type { XFormViewChild } from './XFormViewChild';

interface BaseXFormViewLabelPart {
	readonly expression: string | null;
	readonly textContent: string | null;
}

// Supports `<label ref="expr">`, also anticipating `<output>`
class XFormViewLabelDynamicPart implements BaseXFormViewLabelPart {
	readonly textContent: null = null;

	constructor(readonly expression: string) {}
}

class XFormViewLabelStaticPart implements BaseXFormViewLabelPart {
	readonly expression: null = null;

	constructor(readonly textContent: string) {}
}

type XFormViewLabelPart = XFormViewLabelDynamicPart | XFormViewLabelStaticPart;

export class XFormViewLabel {
	static fromViewChild(child: XFormViewChild, childElement: Element): XFormViewLabel | null {
		const labelElement = childElement.querySelector(':scope > label');

		if (labelElement == null) {
			return null;
		}

		return new this(child, labelElement);
	}

	readonly parts: readonly XFormViewLabelPart[];

	// TODO: not sure if this makes sense here. The idea is there's a single
	// canonical way to resolve a label's entire text, either by its combined text
	// and evaluated outputs, or by its evaluated ref. If implemented here, it
	// would be expected that any re-evaluation would be reactive based on its
	// dependencies (implementation of that also pending).
	//
	// It may just make more sense for this to be fully a view responsibility.
	get labelText(): string {
		const textParts = this.parts.map((part) => {
			if (part.textContent == null) {
				throw new Error('todo');
			}

			return part.textContent;
		});

		return textParts.join('');
	}

	// TODO: if `labelText` does stay above, the `XFormViewChild` will be a likely
	// way to establish context for evaluating expressions defined by `<label
	// ref>` and `<output value>`
	protected constructor(_child: XFormViewChild, labelElement: Element) {
		// TODO: `nodeset` supported?
		const ref = labelElement.getAttribute('ref');

		if (ref != null) {
			this.parts = [new XFormViewLabelDynamicPart(ref)];
		} else {
			this.parts = Array.from(labelElement.childNodes).map((childNode) => {
				const { nodeType } = childNode;

				if (nodeType === Node.ELEMENT_NODE && (childNode as Element).localName === 'output') {
					throw new Error('todo');
				}

				const { textContent } = childNode;

				if (textContent == null) {
					throw new Error(`Invalid label child node (missing textContent), of type ${nodeType}`);
				}

				return new XFormViewLabelStaticPart(childNode.textContent ?? '');
			});
		}
	}
}
