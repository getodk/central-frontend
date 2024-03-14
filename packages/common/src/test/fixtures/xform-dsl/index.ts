/* eslint @typescript-eslint/no-shadow: warn */

import { BodyXFormsElement } from './BodyXFormsElement.ts';
import { EmptyXFormsElement } from './EmptyXFormsElement.ts';
import { HeadXFormsElement } from './HeadXFormsElement.ts';
import type { NamespaceTuples } from './HtmlXFormsElement.ts';
import { HtmlXFormsElement } from './HtmlXFormsElement.ts';
import { StringLiteralXFormsElement } from './StringLiteralXFormsElement.ts';
import { TagXFormsElement } from './TagXFormsElement.ts';
import type { XFormsElement } from './XFormsElement.ts';
import { emptyMap } from './collections.ts';

type AttributeTuple = readonly [nodeName: string, value: string];

type AttributeTuples = readonly AttributeTuple[];

type Int = number;

const parseAttributes = (name: string): Map<string, string> => {
	if (!name.includes(' ')) {
		return new Map();
	}

	const attributes = new Map<string, string>();
	const words = name.split(' ');

	for (const word of words.slice(1)) {
		const parts = word.match(/^(.*)(?<!\\)=(["'].*)/);

		if (parts == null) {
			continue;
		}

		const [, attributeName, attributeValueString] = parts;
		attributes.set(
			attributeName!,
			attributeValueString!.substring(1, attributeValueString!.length - 1)
		);
	}

	return attributes;
};

const parseName = (name: string): string => {
	if (!name.includes(' ')) {
		return name;
	}

	// This non-null assertion is inherently safe, as `String#split` will always
	// return at least one item. In theory, this could be expressed in the
	// built-in lib type as:
	//
	// `split(...): [string, ...string[]]`.
	//
	// Maybe ask if that's a welcome contribution?
	return name.split(' ')[0]!;
};

interface t {
	(name: string, ...children: XFormsElement[]): XFormsElement;
	(name: string, innerHtml: string): XFormsElement;
}

export const t: t = (name, ...args): XFormsElement => {
	const parsedName = parseName(name);
	const attributes = parseAttributes(name);

	const [innerHtmlOrFirstChild] = args;

	if (innerHtmlOrFirstChild == null) {
		return new EmptyXFormsElement(parsedName, attributes);
	}

	if (typeof innerHtmlOrFirstChild === 'string') {
		return new StringLiteralXFormsElement(parsedName, attributes, innerHtmlOrFirstChild);
	}

	return new TagXFormsElement(parsedName, attributes, args as readonly XFormsElement[]);
};

// It would have been nice to use the `interface` technique to declare overrides for
// this, but TypeScript rejects it (presumably because it is non-variadic, the
// signature length varies, and the optional parameter comes first)
export const html = (
	...args:
		| [HeadXFormsElement, BodyXFormsElement]
		| [NamespaceTuples, HeadXFormsElement, BodyXFormsElement]
): HtmlXFormsElement => {
	const head = args.length === 3 ? args[1] : args[0];
	const body = args.length === 3 ? args[2] : args[1];
	const additionalNamespaces = args.length === 3 ? args[0] : [];

	return new HtmlXFormsElement(head, body, additionalNamespaces);
};

export const head = (...children: XFormsElement[]): HeadXFormsElement => {
	return new HeadXFormsElement(children);
};

export const body = (...children: XFormsElement[]): BodyXFormsElement => {
	return new BodyXFormsElement(children);
};

export const title = (innerHTML: string): XFormsElement => {
	return t('h:title', innerHTML);
};

interface model {
	(...children: XFormsElement[]): XFormsElement;
	(attributes: AttributeTuples, ...children: XFormsElement[]): XFormsElement;
}

export const model: model = (attributesOrFirstChild, ...restChildren) => {
	const attributes = Array.isArray(attributesOrFirstChild)
		? (attributesOrFirstChild as AttributeTuples)
		: [];
	const children = Array.isArray(attributesOrFirstChild)
		? restChildren
		: [attributesOrFirstChild as XFormsElement, ...restChildren];
	const name = `model ${attributes
		.map(([nodeName, value]) => `${nodeName}="${value}"`)
		.join(' ')}`.trim();

	return t(name, ...children);
};

export const mainInstance = (...children: XFormsElement[]): XFormsElement => {
	return t('instance', ...children);
};

export const instance = (name: string, ...children: XFormsElement[]): XFormsElement => {
	return t(`instance id="${name}"`, t('root', ...children));
};

export const input = (ref: string, ...children: XFormsElement[]): XFormsElement => {
	return t(`input ref="${ref}"`, ...children);
};

export const select1 = (ref: string, ...children: XFormsElement[]): XFormsElement => {
	return t(`select1 ref="${ref}"`, ...children);
};

interface select1Dynamic {
	(ref: string, nodesetRef: string): XFormsElement;
	(ref: string, nodesetRef: string, valueRef: string, labelRef: string): XFormsElement;
}

export const select1Dynamic: select1Dynamic = (
	ref,
	nodesetRef,
	valueRef = 'value',
	labelRef = 'label'
): XFormsElement => {
	return t(
		`select1 ref="${ref}"`,
		t(`itemset nodeset="${nodesetRef}"`, t(`value ref="${valueRef}"`), t(`label ref="${labelRef}"`))
	);
};

export const group = (ref: string, ...children: XFormsElement[]): XFormsElement => {
	return t(`group ref="${ref}"`, ...children);
};

interface repeat {
	(ref: string, ...children: XFormsElement[]): XFormsElement;
	(ref: string, countRef: string, ...children: XFormsElement[]): XFormsElement;
}

export const repeat: repeat = (ref, ...rest): XFormsElement => {
	const [countRefOrMaybeChild, ...restChildren] = rest;

	let countAttribute = '';
	let children: readonly XFormsElement[];

	if (typeof countRefOrMaybeChild === 'object') {
		children = rest as readonly XFormsElement[];
	} else {
		children = restChildren;

		if (countRefOrMaybeChild != null) {
			countAttribute = ` jr:count="${countRefOrMaybeChild}"`;
		}
	}

	return t(`repeat nodeset="${ref}${countAttribute}"`, ...children);
};

export const label = (innerHtml: string): XFormsElement => {
	return new StringLiteralXFormsElement('label', emptyMap(), innerHtml);
};

export const item = (value: Int | string, label: string): XFormsElement => {
	return t('item', t('label', label), t('value', String(value)));
};

export const setvalue = (event: string, ref: string, value?: string): XFormsElement => {
	const valueAttribute = value == null ? '' : ` value="${value}"`;

	return t(`setvalue event="${event}" ref="${ref}"${valueAttribute}`);
};

export const setvalueLiteral = (event: string, ref: string, innerHtml: string): XFormsElement => {
	return t(`setvalue event="${event}" ref="${ref}"`, innerHtml);
};

export { bind } from './BindBuilderXFormsElement.ts';
