import type { XFormsXPathDocument } from '../adapter/XFormsXPathNode.ts';
import type { StaticElementConstructor, StaticElementOptions } from './StaticElement.ts';
import { StaticElement } from './StaticElement.ts';
import { StaticParentNode } from './StaticParentNode.ts';

export type StaticDocumentRootFactory<T extends StaticDocument, Root extends StaticElement> = (
	staticDocument: T
) => Root;

type StaticDocumentRootConstructor<DocumentRoot extends StaticElement> = StaticElementConstructor<
	DocumentRoot,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any
>;

interface StaticDocumentOptions<DocumentRoot extends StaticElement> {
	readonly DocumentRootConstructor: StaticDocumentRootConstructor<DocumentRoot>;
	readonly documentRoot: StaticElementOptions;
}

export abstract class StaticDocument<DocumentRoot extends StaticElement = StaticElement>
	extends StaticParentNode<'document'>
	implements XFormsXPathDocument
{
	readonly rootDocument: StaticDocument;
	readonly root: DocumentRoot;
	readonly parent = null;
	readonly children: readonly [root: DocumentRoot];

	constructor(options: StaticDocumentOptions<DocumentRoot>) {
		super('document');

		this.rootDocument = this;

		const { DocumentRootConstructor, documentRoot } = options;
		const root = new DocumentRootConstructor(this, documentRoot);

		this.root = root;
		this.children = [root];
	}

	// XFormsXPathDocument
	getXPathValue(): string {
		return this.root.getXPathValue();
	}
}

// prettier-ignore
export type StaticDocumentConstructor<
	T extends StaticDocument<DocumentRoot>,
	DocumentRoot extends StaticElement,
> =
	& Pick<typeof StaticDocument, keyof typeof StaticDocument>
	& {
			readonly prototype: T;

			new (options: StaticDocumentOptions<DocumentRoot>): T;
	};
