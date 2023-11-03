import type { XFormDOM } from './XFormDOM.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import { XFormEntryBinding } from './XFormEntryBinding.ts';

export class XFormEntry extends Map<string, XFormEntryBinding> {
	protected readonly instanceDOM: XFormDOM;

	constructor(readonly form: XFormDefinition) {
		super();

		const instanceDOM = form.xformDOM.createInstance();

		this.instanceDOM = instanceDOM;

		for (const [nodeset, bind] of form.model.binds) {
			this.set(nodeset, new XFormEntryBinding(form, instanceDOM, this, bind));
		}
	}

	toJSON() {
		return {};
	}
}
