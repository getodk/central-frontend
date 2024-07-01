import type { XFormDefinition } from '../XFormDefinition.ts';
import { DependencyContext } from '../expression/DependencyContext.ts';
import type { HintDefinition } from '../parse/text/HintDefinition.ts';
import type { ItemLabelDefinition } from '../parse/text/ItemLabelDefinition.ts';
import type { LabelDefinition } from '../parse/text/LabelDefinition.ts';
import type { BodyElementParentContext } from './BodyDefinition.ts';

/**
 * These category names roughly correspond to each of the ODK XForms spec's
 * {@link https://getodk.github.io/xforms-spec/#body-elements | Body Elements}
 * tables.
 */
type BodyElementCategory = 'control' | 'structure' | 'support' | 'UNSUPPORTED';

export abstract class BodyElementDefinition<Type extends string> extends DependencyContext {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static isCompatible(localName: string, element: Element): boolean {
		throw new Error('Must be overridden by BodyElementDefinition subclass');
	}

	abstract readonly category: BodyElementCategory;
	abstract readonly type: Type;
	readonly hint: HintDefinition | null = null;
	readonly label: ItemLabelDefinition | LabelDefinition | null = null;

	readonly reference: string | null = null;
	readonly parentReference: string | null;

	protected constructor(
		protected readonly form: XFormDefinition,
		readonly parent: BodyElementParentContext,
		readonly element: Element
	) {
		super();
		this.parentReference = parent.reference;
	}

	toJSON(): object {
		const { form, parent, ...rest } = this;

		return rest;
	}
}

type BodyElementDefinitionClass = Pick<
	typeof BodyElementDefinition,
	keyof typeof BodyElementDefinition
>;

// prettier-ignore
export type BodyElementDefinitionConstructor =
	& BodyElementDefinitionClass
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	& (new (form: XFormDefinition, element: Element) => BodyElementDefinition<any>);

type BodyElementDefinitionInstance = InstanceType<BodyElementDefinitionConstructor>;

export type TypedBodyElementDefinition<Type extends string> = Extract<
	BodyElementDefinitionInstance,
	{ readonly type: Type }
>;
