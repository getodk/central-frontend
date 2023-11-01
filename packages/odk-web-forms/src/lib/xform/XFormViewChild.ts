import type { CollectionValues } from '../collections/types.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import { XFormViewLabel } from './XFormViewLabel.ts';

const UNSUPPORTED_XFORM_VIEW_CHILD_TYPE = 'UNSUPPORTED';

export type UnsupportedXFormViewChildType = typeof UNSUPPORTED_XFORM_VIEW_CHILD_TYPE;

const XFORM_VIEW_CHILD_TYPES = ['input'] as const;

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

const refAttributePriority = ['ref', 'nodeset'] as const;

type XFormViewChildRefAttribute = CollectionValues<typeof refAttributePriority>;

// const reverseRefAttributePriority = refAttributePriority.slice().reverse();

// XLSForms will assign `nodeset` to `<repeat>` and `<itemset>`, otherwise it
// will assign `ref`. Both are accepted by spec. It's marginally more efficient
// to check in the preferred order by type.
const refAttributePriorities: Record<string, readonly XFormViewChildRefAttribute[]> = {
	input: refAttributePriority,
	// itemset: reverseRefAttributePriority,
	// repeat: reverseRefAttributePriority,
} satisfies Record<SupportedXFormViewChildType, readonly XFormViewChildRefAttribute[]>;

// TODO: should we get the ref (etc) for unsupported/unrecognized view types? It
// would make sense if (and only if) forms out there have group-like elements
// that aren't actually named `<group>` for whatever reason...
const viewChildRef = (type: XFormViewChildType, element: Element): string | null => {
	const attributes = refAttributePriorities[type] ?? refAttributePriority;

	for (const attribute of attributes) {
		const ref = element.getAttribute(attribute);

		if (ref != null) {
			return ref;
		}
	}

	return null;
};

// TODO: this will likely be supported by multiple classes to handle particulars
// of different view elements.
export class XFormViewChild {
	static children(form: XFormDefinition, contextElement: Element): readonly XFormViewChild[] {
		const childElements = Array.from(contextElement.children);

		return childElements.map((childElement) => new this(form, childElement));
	}

	readonly type: XFormViewChildType;
	readonly ref: string | null;
	readonly label: XFormViewLabel | null;
	// TODO: `<group>` and `<repeat>`
	// readonly children: readonly XFormViewChild[];

	protected constructor(
		protected readonly form: XFormDefinition,
		element: Element
	) {
		const type = (this.type = viewChildType(element));
		this.ref = viewChildRef(type, element);
		this.label = XFormViewLabel.fromViewChild(this, element);
		// this.children = [];
	}

	toJSON() {
		const { form, ...rest } = this;

		return rest;
	}
}
