import type { SecondaryInstanceSourceFormat } from '../../../parse/model/SecondaryInstance/sources/SecondaryInstanceSource.ts';
import type { XFormsXPathDocument } from '../adapter/XFormsXPathNode.ts';
import type { StaticAttribute } from './StaticAttribute.ts';
import type { StaticElementOptions } from './StaticElement.ts';
import { StaticElement } from './StaticElement.ts';
import { StaticParentNode } from './StaticParentNode.ts';

interface StaticDocumentOptions {
  readonly documentRoot: StaticElementOptions;
  readonly nodesetPrefix?: string;
  readonly sourceFormat?: SecondaryInstanceSourceFormat | null;
}

export class StaticDocument extends StaticParentNode<'document'> implements XFormsXPathDocument {
  readonly rootDocument: StaticDocument;
  readonly root: StaticElement;
  readonly parent = null;
  readonly nodeset: string;
  readonly sourceFormat: SecondaryInstanceSourceFormat | null;
  readonly children: readonly [root: StaticElement];
  readonly childElements: readonly [root: StaticElement];
  readonly attributes: readonly StaticAttribute[] = [];

  constructor(options: StaticDocumentOptions) {
    super('document');

    this.nodeset = options.nodesetPrefix ?? '/';
    this.sourceFormat = options.sourceFormat ?? null;
    this.rootDocument = this;

    const { documentRoot } = options;
    const root = new StaticElement(this, documentRoot);

    this.root = root;
    this.children = [root];
    this.childElements = this.children;
  }

  // XFormsXPathDocument
  getXPathValue(): string {
    return this.root.getXPathValue();
  }
}
