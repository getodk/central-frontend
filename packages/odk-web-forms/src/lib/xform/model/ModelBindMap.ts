import type { XFormDefinition } from '../XFormDefinition.ts';
import type { BindElement, BindNodeset } from './BindDefinition.ts';
import { BindDefinition } from './BindDefinition.ts';
import type { ModelDefinition } from './ModelDefinition.ts';

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

export type ReadonlyModelBindMap = ReadonlyMap<BindNodeset, BindDefinition>;

export class ModelBindMap extends Map<BindNodeset, BindDefinition> implements ReadonlyModelBindMap {
	// This is probably overkill, just produces a type that's readonly at call site.
	static fromModel(model: ModelDefinition): ReadonlyModelBindMap {
		return new this(model.form, model);
	}

	protected constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: ModelDefinition
	) {
		super();

		const bindElements = form.xformDOM.rootEvaluator.evaluateNodes<BindElement & Element>(
			'./xf:bind[@nodeset]',
			{
				contextNode: form.xformDOM.model,
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
			const bind = new BindDefinition(form, model, nodeset, bindElement);

			let ancestorNodeset = bind.parentNodeset;

			while (ancestorNodeset != null && ancestorNodeset.length > 1 && !this.has(ancestorNodeset)) {
				const ancestor = new BindDefinition(
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
		visited: Set<BindDefinition>,
		visiting: Set<BindDefinition>,
		bind: BindDefinition,
		sorted: BindDefinition[]
	): BindDefinition[] {
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
		const visited = new Set<BindDefinition>();
		const visiting = new Set<BindDefinition>();
		const sorted: BindDefinition[] = [];

		for (const bind of this.values()) {
			this.visit(visited, visiting, bind, sorted);
		}

		this.clear();

		for (const bind of sorted) {
			this.set(bind.nodeset, bind);
		}
	}

	getDependencies(bind: BindDefinition) {
		return bind.nodesetDependencies.map((nodeset) => this.get(nodeset));
	}

	toJSON() {
		return Array.from(this.entries());
	}
}
