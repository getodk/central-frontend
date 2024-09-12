import type { XFormDefinition } from '../XFormDefinition.ts';
import { BindDefinition } from './BindDefinition.ts';
import type { BindElement, BindNodeset } from './BindElement.ts';
import type { ModelDefinition } from './ModelDefinition.ts';

class ArtificialBindElement implements BindElement {
	readonly localName = 'bind';

	constructor(protected readonly ancestorNodeset: string) {}

	getAttribute(name: 'nodeset'): string;
	getAttribute(name: string): string | null;
	getAttribute(name: string) {
		if (name === 'nodeset') {
			return this.ancestorNodeset;
		}

		return null;
	}

	getAttributeNS() {
		return null;
	}
}

type TopologicalSortIndex = number;

export type SortedNodesetIndexes = ReadonlyMap<BindNodeset, TopologicalSortIndex>;

export class ModelBindMap extends Map<BindNodeset, BindDefinition> {
	// This is probably overkill, just produces a type that's readonly at call site.
	static fromModel(model: ModelDefinition): ModelBindMap {
		return new this(model.form, model);
	}

	protected constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: ModelDefinition
	) {
		const bindElements = form.xformDOM.rootEvaluator.evaluateNodes<BindElement & Element>(
			'./xf:bind[@nodeset]',
			{
				contextNode: form.xformDOM.model,
			}
		);

		super(
			bindElements.map((bindElement) => {
				const nodeset = bindElement.getAttribute('nodeset');
				const bind = new BindDefinition(form, model, nodeset, bindElement);

				return [nodeset, bind];
			})
		);

		this.getOrCreateBindDefinition(form.rootReference);
	}

	getOrCreateBindDefinition(nodeset: string): BindDefinition {
		let bind = this.get(nodeset);

		if (bind == null) {
			const bindElement = new ArtificialBindElement(nodeset);

			bind = new BindDefinition(this.form, this.model, nodeset, bindElement);
			this.set(nodeset, bind);
		}

		return bind;
	}

	toJSON() {
		return Array.from(this.entries());
	}
}
