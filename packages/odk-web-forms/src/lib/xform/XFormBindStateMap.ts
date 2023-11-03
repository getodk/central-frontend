import { XFormBindState } from './XFormBindState.ts';
import type { XFormDefinition } from './XFormDefinition.ts';

export class XFormBindStateMap extends Map<string, XFormBindState> {
	constructor(protected readonly form: XFormDefinition) {
		super();

		for (const [nodeset, bind] of form.model.binds) {
			this.set(nodeset, new XFormBindState(form, this, bind));
		}
	}

	toJSON() {
		return {};
	}
}
