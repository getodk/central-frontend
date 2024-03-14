import { XFORMS_NAMESPACE_URI } from '@odk-web-forms/common/constants/xmlns.ts';
import { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import { xpathEvaluator } from './lib/xpath/evaluator.ts';

const domParser = new DOMParser();

const openingTag = (element: Element) => element.outerHTML.replace(/>(.|\n)*/, '>');

/**
 * Per ODK XForms spec:
 *
 * > To link a body element with its corresponding data node and binding, both
 * > `nodeset` and `ref` attributes can be used. The convention that is helpful is
 * > the one used in XLSForms: use `nodeset="/some/path"` for `<repeat>` and
 * > `<itemset>` elements and use `ref="/some/path"` for everything else.
 */
const normalizeBodyRefNodesetAttributes = (body: Element): void => {
	const referenceElements = body.querySelectorAll(
		'itemset[ref], repeat[ref], *[nodeset]:not(itemset, repeat)'
	);

	for (const element of referenceElements) {
		switch (element.localName) {
			case 'itemset':
			case 'repeat': {
				// Non-null assertion safe by selector
				const ref = element.getAttribute('ref')!;

				element.setAttribute('nodeset', ref);
				element.removeAttribute('ref');
				break;
			}

			default: {
				// Non-null assertion safe by selector
				const nodeset = element.getAttribute('nodeset')!;

				element.setAttribute('ref', nodeset);
				element.removeAttribute('nodeset');
			}
		}
	}
};

const normalizeRepeatGroups = (xformDocument: XMLDocument, body: Element): void => {
	const repeats = body.querySelectorAll('repeat');

	for (const repeat of repeats) {
		// Non-null assertion safe because `querySelectorAll` returns descendants
		const parent = repeat.parentElement!;
		const repeatNodeset = repeat.getAttribute('nodeset');

		if (repeatNodeset == null) {
			throw new Error('Found <repeat> without `nodeset` attribute');
		}

		let group: Element | null = null;

		if (parent.localName === 'group') {
			const groupRef = parent.getAttribute('ref');

			if (groupRef === repeatNodeset) {
				group = parent;
			}
		}

		if (group == null) {
			group = xformDocument.createElementNS(XFORMS_NAMESPACE_URI, 'group');
			group.setAttribute('ref', repeatNodeset);
			repeat.before(group);
			group.append(repeat);
		}
	}
};

interface NormalizedXForm {
	readonly xformDocument: XMLDocument;
	readonly rootEvaluator: XFormsXPathEvaluator;
	readonly html: Element;
	readonly body: Element;
	readonly normalizedXML: string;
}

interface XFormDOMNormalizationOptions {
	readonly isNormalized: boolean;
}

/**
 * Performs preprocess operations to normalize certain aspects of an XForm
 * structure for consistency when building up its runtime representations.
 * Currently this preprocessing:
 *
 * - Ensures consistent use of `ref` and `nodeset` where ambiguous in the
 *   ODK XForms spec
 * - Ensures `<repeat>` body elements are always enclosed by a `<group>`
 *   with the same `ref`
 */
const parseNormalizedXForm = (
	sourceXML: string,
	options: XFormDOMNormalizationOptions
): NormalizedXForm => {
	const xformDocument: XMLDocument = domParser.parseFromString(sourceXML, 'text/xml');
	const rootEvaluator = xpathEvaluator(xformDocument);
	const html = rootEvaluator.evaluateNonNullElement('/h:html');
	const body = rootEvaluator.evaluateNonNullElement('./h:body', {
		contextNode: html,
	});

	let normalizedXML: string;

	if (options.isNormalized) {
		normalizedXML = sourceXML;
	} else {
		normalizeBodyRefNodesetAttributes(body);
		normalizeRepeatGroups(xformDocument, body);

		normalizedXML = html.outerHTML;
	}

	return {
		xformDocument,
		rootEvaluator,
		html,
		body,
		normalizedXML,
	};
};

export class XFormDOM {
	static from(sourceXML: string) {
		return new this(sourceXML, { isNormalized: false });
	}

	protected readonly normalizedXML: string;

	// XPath
	readonly rootEvaluator: XFormsXPathEvaluator;
	readonly primaryInstanceEvaluator: XFormsXPathEvaluator;

	// Commonly accessed landmark nodes
	readonly xformDocument: XMLDocument;

	readonly html: Element;

	readonly head: Element;
	readonly title: Element;

	readonly model: Element;
	readonly primaryInstance: Element;
	readonly primaryInstanceRoot: Element;

	readonly body: Element;

	protected constructor(
		protected readonly sourceXML: string,
		options: XFormDOMNormalizationOptions
	) {
		const normalizedXForm: NormalizedXForm = parseNormalizedXForm(sourceXML, options);
		const { xformDocument, html, body, rootEvaluator, normalizedXML } = normalizedXForm;
		const head = rootEvaluator.evaluateNonNullElement('./h:head', {
			contextNode: html,
		});
		const title = rootEvaluator.evaluateNonNullElement('./h:title', {
			contextNode: head,
		});
		const model = rootEvaluator.evaluateNonNullElement('./xf:model', {
			contextNode: head,
		});
		// TODO: Evidently primary instance root will not always have an id
		const primaryInstanceRoot = rootEvaluator.evaluateNonNullElement('./xf:instance/*[@id]', {
			contextNode: model,
		});
		// TODO: invert primary instance/root lookups
		const primaryInstance = rootEvaluator.evaluateNonNullElement('..', {
			contextNode: primaryInstanceRoot,
		});

		this.normalizedXML = normalizedXML;
		this.rootEvaluator = rootEvaluator;
		this.primaryInstanceEvaluator = xpathEvaluator(primaryInstance);
		this.xformDocument = xformDocument;
		this.html = html;
		this.head = head;
		this.title = title;
		this.model = model;
		this.primaryInstance = primaryInstance;
		this.primaryInstanceRoot = primaryInstanceRoot;
		this.body = body;
	}

	// TODO: anticipating this will be an entry point for edits as well
	createInstance(): XFormDOM {
		return new XFormDOM(this.normalizedXML, { isNormalized: true });
	}

	toJSON() {
		const {
			rootEvaluator,
			primaryInstanceEvaluator,
			html,
			head,
			title,
			model,
			primaryInstance,
			primaryInstanceRoot,
			xformDocument,
			...rest
		} = this;

		return {
			...rest,
			xformDocument: '#document',
			html: openingTag(html),
			head: openingTag(head),
			title: openingTag(title),
			model: openingTag(model),
			primaryInstance: openingTag(primaryInstance),
			primaryInstanceRoot: openingTag(primaryInstanceRoot),
		};
	}
}
