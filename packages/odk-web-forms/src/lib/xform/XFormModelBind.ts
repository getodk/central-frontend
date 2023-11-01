import { bindDataType, type XFormDataType } from './XFormDataType.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import type { XFormModelDefinition } from './XFormModelDefinition';

export type BindNodeset = string;

export interface BindElement extends Element {
	getAttribute(name: 'nodeset'): BindNodeset;
	getAttribute(name: string): string | null;
}

export class XFormModelBind {
	readonly bindType: string | null;
	readonly dataType: XFormDataType;

	readonly calculate: string | null;
	readonly constraint: string | null;
	readonly readonly: string | null;
	readonly relevant: string | null;
	readonly required: string | null;
	readonly saveIncomplete: string | null;

	// TODO: these are deferred just to put off sharing namespace stuff
	// readonly requiredMsg: string | null;
	// readonly constraintMsg: string | null;
	// readonly preload: string | null;
	// readonly preloadParams: string | null;
	// readonly 'max-pixels': string | null;

	constructor(
		protected readonly form: XFormDefinition,
		protected readonly model: XFormModelDefinition,
		protected readonly nodeset: string,
		protected readonly bindElement: BindElement
	) {
		const bindType = (this.bindType = bindElement.getAttribute('type'));

		this.dataType = bindDataType(bindType);

		this.calculate = bindElement.getAttribute('calculate');
		this.constraint = bindElement.getAttribute('constraint');
		this.readonly = bindElement.getAttribute('readonly');
		this.relevant = bindElement.getAttribute('relevant');
		this.required = bindElement.getAttribute('required');
		this.saveIncomplete = bindElement.getAttribute('saveIncomplete');
		// this.requiredMsg = bindElement.getAttributeNS(...)
		// this.constraintMsg = bindElement.getAttributeNS(...)
		// this.preload = bindElement.getAttributeNS(...)
		// this.preloadParams = bindElement.getAttributeNS(...)
		// this['max-pixels'] = bindElement.getAttributeNS(...)
	}

	toJSON() {
		const { form, model, /* modelElement, */ bindElement, ...rest } = this;

		return rest;
	}
}
