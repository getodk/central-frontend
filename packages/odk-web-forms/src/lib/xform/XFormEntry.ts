import { createMemo, on, type Accessor } from 'solid-js';
import type { XFormDOM } from './XFormDOM.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import { XFormEntryBinding } from './XFormEntryBinding.ts';
import type { XFormViewChild } from './XFormViewChild.ts';

export class XFormEntry {
	protected readonly bindings: Map<string, XFormEntryBinding>;

	readonly instanceDOM: XFormDOM;

	// Temp, just to be able to visually inspect reactive output
	readonly serializedSubmission: Accessor<string>;

	constructor(readonly form: XFormDefinition) {
		const bindings = new Map<string, XFormEntryBinding>();
		const instanceDOM = form.xformDOM.createInstance();

		this.bindings = bindings;
		this.instanceDOM = instanceDOM;

		for (const [nodeset, bind] of form.model.binds) {
			bindings.set(nodeset, new XFormEntryBinding(form, instanceDOM, this, bind));
		}

		const bindingDependencies = Array.from(bindings.values()).map((binding) => {
			return () => binding.getValue();
		});

		const serializedSubmission = createMemo(
			on(bindingDependencies, () => {
				console.log('Recomputing full submission state');
				return instanceDOM.primaryInstanceRoot.outerHTML;
			})
		);

		this.serializedSubmission = serializedSubmission;
	}

	getBinding(ref: string): XFormEntryBinding | null {
		return this.bindings.get(ref) ?? null;
	}

	getViewBinding(viewChild: XFormViewChild): XFormEntryBinding | null {
		const { ref } = viewChild;

		if (ref == null) {
			return null;
		}

		return this.getBinding(ref);
	}

	toJSON() {
		return {};
	}
}
