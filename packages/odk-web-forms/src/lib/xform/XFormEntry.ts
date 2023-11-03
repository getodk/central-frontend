import { createMemo, on, type Accessor } from 'solid-js';
import type { XFormDOM } from './XFormDOM.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import { XFormEntryBinding } from './XFormEntryBinding.ts';

export class XFormEntry extends Map<string, XFormEntryBinding> {
	readonly instanceDOM: XFormDOM;

	// Temp, just to be able to visually inspect reactive output
	readonly serializedSubmission: Accessor<string>;

	constructor(readonly form: XFormDefinition) {
		super();

		const instanceDOM = form.xformDOM.createInstance();

		this.instanceDOM = instanceDOM;

		for (const [nodeset, bind] of form.model.binds) {
			this.set(nodeset, new XFormEntryBinding(form, instanceDOM, this, bind));
		}

		const bindingDependencies = Array.from(this.values()).map((binding) => {
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

	toJSON() {
		return {};
	}
}
