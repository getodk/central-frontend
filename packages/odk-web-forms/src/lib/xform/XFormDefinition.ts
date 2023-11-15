import { XFormDOM } from './XFormDOM.ts';
import { XFormModelDefinition } from './XFormModelDefinition.ts';
import { BodyDefinition } from './body/BodyDefinition.ts';

export class XFormDefinition {
	readonly xformDOM: XFormDOM;
	readonly xformDocument: XMLDocument;

	readonly id: string;
	readonly title: string;

	readonly body: BodyDefinition;
	readonly model: XFormModelDefinition;

	constructor(readonly sourceXML: string) {
		const xformDOM = XFormDOM.from(sourceXML);

		this.xformDOM = xformDOM;

		const { primaryInstanceRoot, title, xformDocument } = xformDOM;
		const id = primaryInstanceRoot.getAttribute('id');

		if (id == null) {
			throw new Error('Primary instance root has no id');
		}

		this.xformDocument = xformDocument;
		this.id = id;
		this.title = title.textContent ?? '';

		this.body = new BodyDefinition(this);
		this.model = new XFormModelDefinition(this);
	}
}
