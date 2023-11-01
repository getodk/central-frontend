import type { XFormDefinition } from './XFormDefinition.ts';
import type { BindElement, BindNodeset } from './XFormModelBind.ts';
import { XFormModelBind } from './XFormModelBind.ts';
import type { XFormModelDefinition } from './XFormModelDefinition.ts';

export type ReadonlyXFormModelBindMap = ReadonlyMap<BindNodeset, XFormModelBind>;

export class XFormModelBindMap
	extends Map<BindNodeset, XFormModelBind>
	implements ReadonlyXFormModelBindMap
{
	// This is probably overkill, just produces a type that's readonly at call site.
	static fromModel(
		form: XFormDefinition,
		model: XFormModelDefinition,
		modelElement: Element
	): ReadonlyXFormModelBindMap {
		return new this(form, model, modelElement);
	}

	protected constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: XFormModelDefinition,
		modelElement: Element
	) {
		const bindElements = form.rootEvaluator.evaluateNodes<BindElement>('./xf:bind[@nodeset]', {
			contextNode: modelElement,
		});
		const bindEntries = bindElements.map((bindElement): [BindNodeset, XFormModelBind] => {
			const nodeset = bindElement.getAttribute('nodeset');

			return [nodeset, new XFormModelBind(form, model, nodeset, bindElement)];
		});

		super(bindEntries);
	}

	toJSON() {
		return Array.from(this.entries());
	}
}
