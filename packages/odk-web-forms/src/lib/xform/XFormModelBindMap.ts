import type { XFormDefinition } from './XFormDefinition.ts';
import type { BindElement, BindNodeset } from './XFormModelBind.ts';
import { XFormModelBind } from './XFormModelBind.ts';
import type { XFormModelDefinition } from './XFormModelDefinition.ts';

class ArtificialAncestorBindElement {
	constructor(protected readonly ancestorNodeset: string) {}

	getAttribute(name: 'nodeset'): string;
	getAttribute(name: string): string | null;
	getAttribute(name: string) {
		if (name === 'nodeset') {
			return this.ancestorNodeset;
		}

		return null;
	}
}

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
		super();

		const bindElements = form.rootEvaluator.evaluateNodes<BindElement & Element>(
			'./xf:bind[@nodeset]',
			{
				contextNode: modelElement,
			}
		);

		const bindElementEntries = bindElements
			.map((bindElement): readonly [BindNodeset, BindElement] => [
				bindElement.getAttribute('nodeset'),
				bindElement,
			])
			.sort(([a], [b]) => {
				if (a > b) {
					return 1;
				}

				if (b > a) {
					return -1;
				}

				return 0;
			});

		// Build bindings for ancestors without explict `<bind>`s, so that depth > 1
		// descendants' relevance can be determined.
		for (const [nodeset, bindElement] of bindElementEntries) {
			const bind = new XFormModelBind(form, model, nodeset, bindElement);

			let ancestorNodeset = bind.parentNodeset;

			while (ancestorNodeset != null && ancestorNodeset.length > 1 && !this.has(ancestorNodeset)) {
				const ancestor = new XFormModelBind(
					form,
					model,
					ancestorNodeset,
					new ArtificialAncestorBindElement(ancestorNodeset)
				);
				this.set(ancestorNodeset, ancestor);

				ancestorNodeset = ancestor.parentNodeset;
			}

			this.set(nodeset, bind);
		}

		this.sort();
	}

	/**
	 * @see {@link sort}
	 */
	protected visit(
		visited: Set<XFormModelBind>,
		visiting: Set<XFormModelBind>,
		bind: XFormModelBind,
		sorted: XFormModelBind[]
	): XFormModelBind[] {
		if (visited.has(bind)) {
			return sorted;
		}

		if (visiting.has(bind)) {
			throw new Error(`Cycle detected for bind with nodeset: ${bind.nodeset}`);
		}

		visiting.add(bind);

		for (const nodeset of bind.nodesetDependencies) {
			const dependency = this.get(nodeset);

			if (dependency == null) {
				console.warn(`No bind for nodeset: ${nodeset}`);

				continue;
			}

			this.visit(visited, visiting, dependency, sorted);
		}

		visiting.delete(bind);
		visited.add(bind);
		sorted.push(bind);

		return sorted;
	}

	/**
	 * Topological sort (depth first search)
	 */
	protected sort(): void {
		const visited = new Set<XFormModelBind>();
		const visiting = new Set<XFormModelBind>();
		const sorted: XFormModelBind[] = [];

		for (const bind of this.values()) {
			this.visit(visited, visiting, bind, sorted);
		}

		this.clear();

		for (const bind of sorted) {
			this.set(bind.nodeset, bind);
		}
	}

	getDependencies(bind: XFormModelBind) {
		return bind.nodesetDependencies.map((nodeset) => this.get(nodeset));
	}

	toJSON() {
		return Array.from(this.entries());
	}
}
