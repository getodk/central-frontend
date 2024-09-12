import { XFORMS_NAMESPACE_URI, XMLNS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { XFormsXPathEvaluator } from '@getodk/xpath';

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

const normalizeRepeatGroupAttributes = (group: Element, repeat: Element): void => {
	for (const groupAttribute of group.attributes) {
		const { localName, namespaceURI, nodeName, value } = groupAttribute;

		if (
			// Don't propagate namespace declarations (which appear as attributes in
			// the browser/XML DOM, either named `xmlns` or with an `xmlns` prefix,
			// always in the XMLNS namespace).
			namespaceURI === XMLNS_NAMESPACE_URI ||
			// Don't propagate `ref`, it has been normalized as `nodeset` on the
			// repeat element.
			localName === 'ref' ||
			// TODO: this accommodates tests of this normalization process, where
			// certain nodes of interest are given an `id` attribute, and looked up
			// for the purpose of asserting what was normalized about them. It's
			// unclear if there's a generally expected behavior around the attribute.
			localName === 'id'
		) {
			continue;
		}

		// TODO: The `appearance` attribute is propagated from
		// `<group appearance><repeat>` to `<repeat appearance>`. But we presently
		// bail if both elements define the attribute.
		//
		// The spec is clear that the attribute is only supported on `<group>` and
		// control elements, which would suggest it should not be present on a
		// `<repeat>` element directly. But many form fixtures (in e.g. Enketo)
		// do have `<repeat apperance>`.
		//
		// It may be reasonable to relax this by:
		//
		// - Detecting if they share the same appearances, treated as a no-op.
		//
		// - Assume they're both meant to apply, and concatenate.
		if (
			localName === 'appearance' &&
			namespaceURI === XFORMS_NAMESPACE_URI &&
			repeat.hasAttribute(localName)
		) {
			const ref = group.getAttribute('ref');

			throw new Error(
				`Failed to normalize conflicting "appearances" attribute of group/repeat "${ref}"`
			);
		}

		repeat.setAttributeNS(namespaceURI, nodeName, value);
	}
};

const normalizeRepeatGroupLabel = (group: Element, repeat: Element): void => {
	const groupLabel = Array.from(group.children).find((child) => {
		return child.localName === 'label';
	});

	if (groupLabel == null) {
		return;
	}

	const repeatLabel = groupLabel.cloneNode(true) as Element;

	repeatLabel.setAttribute('form-definition-source', 'repeat-group');

	repeat.prepend(repeatLabel);

	groupLabel.remove();
};

const unwrapRepeatGroup = (group: Element, repeat: Element): void => {
	normalizeRepeatGroupAttributes(group, repeat);
	normalizeRepeatGroupLabel(group, repeat);

	group.replaceWith(repeat);
};

const normalizeRepeatGroups = (body: Element): void => {
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

		if (group != null) {
			unwrapRepeatGroup(group, repeat);
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
	const rootEvaluator = new XFormsXPathEvaluator({
		rootNode: xformDocument,
	});
	const html = rootEvaluator.evaluateNonNullElement('/h:html');
	const body = rootEvaluator.evaluateNonNullElement('./h:body', {
		contextNode: html,
	});

	let normalizedXML: string;

	if (options.isNormalized) {
		normalizedXML = sourceXML;
	} else {
		normalizeBodyRefNodesetAttributes(body);
		normalizeRepeatGroups(body);

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
		this.primaryInstanceEvaluator = new XFormsXPathEvaluator({
			rootNode: primaryInstance,
		});
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
