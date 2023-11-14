import type { CollectionValues } from '@odk/common/types/collections/CollectionValues.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import { XFormViewLabel } from './XFormViewLabel.ts';

const UNSUPPORTED_XFORM_VIEW_CHILD_TYPE = 'UNSUPPORTED';

export type UnsupportedXFormViewChildType = typeof UNSUPPORTED_XFORM_VIEW_CHILD_TYPE;

const XFORM_FORM_CONTROLS = ['input'] as const;

const XFORM_UI_ELEMENTS = ['group', 'repeat'] as const;

const XFORM_SUPPORT_ELEMENTS = ['label', 'hint', 'output', 'item', 'itemset', 'value'] as const;

type XFormSupportElement = CollectionValues<typeof XFORM_SUPPORT_ELEMENTS>;

const isSupportElement = (name: string): name is XFormSupportElement =>
	XFORM_SUPPORT_ELEMENTS.includes(name as XFormSupportElement);

const XFORM_LABELED_ELEMENTS = [...XFORM_FORM_CONTROLS, 'group', 'item', 'itemset'] as const;

type XFormLabeledElement = CollectionValues<typeof XFORM_LABELED_ELEMENTS>;

const isLabeledElement = (name: string): name is XFormLabeledElement =>
	XFORM_LABELED_ELEMENTS.includes(name as XFormLabeledElement);

const XFORM_VIEW_CHILD_TYPES = [...XFORM_FORM_CONTROLS, ...XFORM_UI_ELEMENTS] as const;

export type SupportedXFormViewChildType = CollectionValues<typeof XFORM_VIEW_CHILD_TYPES>;

const isSupportedViewChildType = (name: string): name is SupportedXFormViewChildType =>
	XFORM_VIEW_CHILD_TYPES.includes(name as SupportedXFormViewChildType);

export type XFormViewChildType = SupportedXFormViewChildType | UnsupportedXFormViewChildType;

const viewChildType = (element: Element): XFormViewChildType => {
	// TODO: spec includes `odk:rank`, do we check its namespace? All others are
	// implicitly namespaced to XForms. Do we check **their** namespaces too?
	const { localName } = element;

	if (isSupportedViewChildType(localName)) {
		return localName;
	}

	return 'UNSUPPORTED';
};

// TODO: should we get the ref for unsupported/unrecognized view types? It
// would make sense if (and only if) forms out there have group-like elements
// that aren't actually named `<group>` for whatever reason...
const viewChildNodesetReference = (type: XFormViewChildType, element: Element): string | null => {
	const referenceAttribute =
		type === 'repeat' // || type === 'itemset'
			? 'nodeset'
			: 'ref';

	return element.getAttribute(referenceAttribute);
};

// TODO: this will likely be supported by multiple classes to handle particulars
// of different view elements.
export class XFormViewChild {
	static children(form: XFormDefinition, contextElement: Element): readonly XFormViewChild[] {
		const childElements = Array.from(contextElement.children).filter(
			(child) => !isSupportElement(child.localName)
		);

		return childElements.map((childElement) => new this(form, childElement));
	}

	readonly type: XFormViewChildType;
	readonly reference: string | null;
	readonly label: XFormViewLabel | null;
	readonly children: readonly XFormViewChild[];

	protected constructor(
		protected readonly form: XFormDefinition,
		element: Element
	) {
		const type = viewChildType(element);

		this.type = type;
		this.reference = viewChildNodesetReference(type, element);
		this.label = isLabeledElement(type) ? XFormViewLabel.fromViewChild(this, element) : null;
		this.children = XFormViewChild.children(form, element);
	}

	toJSON() {
		const { form, ...rest } = this;

		return rest;
	}
}
