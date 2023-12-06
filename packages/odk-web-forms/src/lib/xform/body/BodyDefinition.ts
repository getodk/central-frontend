import type { XFormDefinition } from '../XFormDefinition.ts';
import { DependencyContext } from '../expression/DependencyContext.ts';
import { UnsupportedBodyElementDefinition } from './UnsupportedBodyElementDefinition.ts';
import { ControlDefinition } from './control/ControlDefinition.ts';
import { InputDefinition } from './control/InputDefinition.ts';
import type { AnySelectDefinition } from './control/select/SelectDefinition.ts';
import { SelectDefinition } from './control/select/SelectDefinition.ts';
import { LogicalGroupDefinition } from './group/LogicalGroupDefinition.ts';
import { PresentationGroupDefinition } from './group/PresentationGroupDefinition.ts';
import { RepeatGroupDefinition } from './group/RepeatGroupDefinition.ts';
import { StructuralGroupDefinition } from './group/StructuralGroupDefinition.ts';

export interface BodyElementParentContext {
	readonly reference: string | null;
	readonly element: Element;
}

type SupportedBodyElementDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| RepeatGroupDefinition
	| LogicalGroupDefinition
	| PresentationGroupDefinition
	| StructuralGroupDefinition
	| InputDefinition
	| AnySelectDefinition;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BodyElementDefinitionConstructor = new (...args: any[]) => SupportedBodyElementDefinition;

const BodyElementDefinitionConstructors = [
	RepeatGroupDefinition,
	LogicalGroupDefinition,
	PresentationGroupDefinition,
	StructuralGroupDefinition,
	InputDefinition,
	SelectDefinition,
] as const satisfies readonly BodyElementDefinitionConstructor[];

export type AnyBodyElementDefinition =
	| SupportedBodyElementDefinition
	| UnsupportedBodyElementDefinition;

export type BodyElementDefinitionArray = readonly AnyBodyElementDefinition[];

export type AnyBodyElementType = AnyBodyElementDefinition['type'];

export type AnyGroupElementDefinition = Extract<
	AnyBodyElementDefinition,
	{ readonly type: `${string}-group` }
>;

export type NonRepeatGroupElementDefinition = Exclude<
	AnyGroupElementDefinition,
	{ readonly type: 'repeat-group' }
>;

const isGroupElementDefinition = (
	element: AnyBodyElementDefinition
): element is AnyGroupElementDefinition => {
	return element.type.endsWith('-group');
};

export const groupElementDefinition = (
	element: AnyBodyElementDefinition
): AnyGroupElementDefinition | null => {
	return isGroupElementDefinition(element) ? element : null;
};

export type AnyControlElementDefinition = Extract<
	AnyBodyElementDefinition,
	{ readonly category: 'control' }
>;

const isControlElementDefinition = (
	element: AnyBodyElementDefinition
): element is AnyControlElementDefinition => {
	return element.category === 'control';
};

export const controlElementDefinition = (
	element: AnyBodyElementDefinition
): AnyControlElementDefinition | null => {
	return isControlElementDefinition(element) ? element : null;
};

type BodyElementReference = string;

class BodyElementMap extends Map<BodyElementReference, AnyBodyElementDefinition> {
	constructor(elements: BodyElementDefinitionArray) {
		super();

		this.mapElementsByReference(elements);
	}

	protected mapElementsByReference(elements: BodyElementDefinitionArray) {
		for (const element of elements) {
			const { reference } = element;

			if (element instanceof RepeatGroupDefinition) {
				if (reference == null) {
					throw new Error('Missing reference for repeat/repeat group');
				}

				this.set(reference, element);
				this.mapElementsByReference(element.repeatChildren);
			}

			if (
				element instanceof LogicalGroupDefinition ||
				element instanceof PresentationGroupDefinition ||
				element instanceof StructuralGroupDefinition
			) {
				if (reference != null) {
					this.set(reference, element);
				}

				this.mapElementsByReference(element.children);
			}

			if (element instanceof ControlDefinition) {
				this.set(element.reference, element);
			}
		}
	}

	override set(reference: BodyElementReference, element: AnyBodyElementDefinition) {
		if (this.has(reference)) {
			throw new Error(`Multiple body elements for reference: ${reference}`);
		}

		return super.set(reference, element);
	}

	getBodyElementType(reference: BodyElementReference): AnyBodyElementType | null {
		return this.get(reference)?.type ?? null;
	}

	toJSON() {
		return Object.fromEntries(this.entries());
	}
}

export class BodyDefinition extends DependencyContext {
	static getChildElementDefinitions(
		form: XFormDefinition,
		parent: BodyElementParentContext,
		parentElement: Element,
		children: readonly Element[] = Array.from(parentElement.children)
	): readonly AnyBodyElementDefinition[] {
		return Array.from(children).map((element) => {
			const { localName } = element;

			for (const Constructor of BodyElementDefinitionConstructors) {
				if (Constructor.isCompatible(localName, element)) {
					return new Constructor(form, parent, element);
				}
			}

			return new UnsupportedBodyElementDefinition(form, parent, element);
		});
	}

	readonly element: Element;
	readonly elements: readonly AnyBodyElementDefinition[];

	protected readonly elementsByReference: BodyElementMap;

	// DependencyContext
	readonly parentReference = null;
	readonly reference: string;

	constructor(protected readonly form: XFormDefinition) {
		super();

		const { body: element } = form.xformDOM;

		this.reference = form.rootReference;
		this.element = element;
		this.elements = BodyDefinition.getChildElementDefinitions(form, this, element);
		this.elementsByReference = new BodyElementMap(this.elements);
	}

	getBodyElement(reference: string): AnyBodyElementDefinition | null {
		return this.elementsByReference.get(reference) ?? null;
	}

	getRepeatGroup(reference: string): RepeatGroupDefinition | null {
		const element = this.getBodyElement(reference);

		if (element?.type === 'repeat-group') {
			return element;
		}

		return null;
	}

	toJSON() {
		const { form, ...rest } = this;

		return rest;
	}
}
