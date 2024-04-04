import { XFormDOM } from './XFormDOM.ts';
import { BodyDefinition } from './body/BodyDefinition.ts';
import { ModelDefinition } from './model/ModelDefinition.ts';

export class XFormDefinition {
	readonly xformDOM: XFormDOM;
	readonly xformDocument: XMLDocument;

	readonly id: string;
	readonly title: string;

	readonly rootReference: string;

	readonly body: BodyDefinition;
	readonly model: ModelDefinition;

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

		// TODO: highly unlikely primary instance root will need a namespace prefix
		// but noting it just in case there is such weird usage...
		this.rootReference = `/${primaryInstanceRoot.localName}`;

		this.body = new BodyDefinition(this);
		this.model = new ModelDefinition(this);
	}
}
