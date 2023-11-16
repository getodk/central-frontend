import { createBindingState, type BindingState } from '../reactivity/model-state.ts';
import type { XFormXPathEvaluator } from '../xpath/XFormXPathEvaluator.ts';
import type { XFormDOM } from './XFormDOM.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import type { XFormEntry } from './XFormEntry.ts';
import type { AnyBodyElementDefinition } from './body/BodyDefinition.ts';
import type { BindDefinition } from './model/BindDefinition.ts';

export class XFormEntryBinding {
	readonly evaluator: XFormXPathEvaluator;

	// TODO: non-element bindings (i.e. Attr, ...?)
	protected readonly modelNode: Element;

	readonly nodeset: string;
	readonly bodyElement: AnyBodyElementDefinition | null;

	// TODO: ideally this would not be public. Perhaps it can be again if state
	// becomes part of this class?
	readonly state: BindingState;

	readonly parent: XFormEntryBinding | null;

	constructor(
		readonly form: XFormDefinition,
		protected readonly instanceDOM: XFormDOM,
		protected readonly entry: XFormEntry,
		readonly bind: BindDefinition
	) {
		const { primaryInstanceEvaluator } = instanceDOM;
		this.evaluator = primaryInstanceEvaluator;

		const { nodeset, parentNodeset } = bind;
		const modelNode = primaryInstanceEvaluator.evaluateNonNullElement(nodeset);

		this.nodeset = nodeset;
		this.bodyElement = form.body.getBodyElement(nodeset);
		this.modelNode = modelNode;

		if (parentNodeset == null) {
			this.parent = null;
		} else {
			const parent = entry.getBinding(parentNodeset);

			if (parent == null) {
				console.error('No binding for parent nodeset', parentNodeset);
			}

			this.parent = parent;
		}

		this.state = createBindingState(entry, this);
	}

	getModelElement(): Element {
		return this.modelNode;
	}

	getValue = (): string => {
		return this.state.getValue();
	};

	isReadonly(): boolean {
		return this.state.isReadonly();
	}

	isRelevant(): boolean {
		const { parent } = this;

		if (parent != null && !parent.isRelevant()) {
			console.log('skip self relevant check, parent is non-relevant');
			console.log('self:', this.bind.nodeset);
			console.log('parent:', parent.bind.nodeset);
			return false;
		}

		const result = this.state.isRelevant();

		if (!result) {
			console.log('self non-relevant', this.bind.nodeset);
		}

		return result;
	}

	isRequired(): boolean {
		return this.state.isRequired();
	}

	setValue(value: string): void {
		this.state.setValue(value);
	}

	toJSON() {
		return {};
	}
}
