import type { Signal } from 'solid-js';
import { createSignal } from 'solid-js';

// TODO: the assumption here is that an XForm may only bind elements and attributes.
// Is that assumption correct?
type ModelNode = Attr | Element;

const isModelAttribute = (node: ModelNode): node is Attr => node.nodeType === Node.ATTRIBUTE_NODE;

const isModelElement = (node: ModelNode): node is Element => node.nodeType === Node.ELEMENT_NODE;

/**
 * Only `Element`s which have no children in XForm model should read/write model values
 * (I think?!)
 */
interface ModelValueElement extends Element {
	readonly childElementCount: 0;
}

type ModelValueNode = Attr | ModelValueElement;

const isModelValueNode = (node: ModelNode): node is ModelValueNode =>
	isModelAttribute(node) || (isModelElement(node) && node.childElementCount === 0);

/**
 * This is a simplification of the actual Solid type, both because it's all we intend
 * to use, and because Solid's type can't be inferred reasonably when e.g. binding
 * `const foo: Setter<Bar> = (arg) => ...`
 */
type SolidSetterParameter<T> = T | ((previousValue: T) => T);

export const createModelNodeSignal = (node: ModelNode): Signal<string> => {
	if (!isModelValueNode(node)) {
		const accessor = () => '';
		const setter = () => '';

		return [accessor, setter];
	}

	let getDOMValue: () => string;
	let setDOMValue: (value: string) => string;

	if (isModelAttribute(node)) {
		getDOMValue = () => node.value;
		setDOMValue = (value) => {
			return (node.value = value);
		};
	} else {
		getDOMValue = () => node.textContent ?? '';
		setDOMValue = (value) => {
			return (node.textContent = value);
		};
	}

	const signal = createSignal(getDOMValue());
	const [getter, baseSetter] = signal;

	const setter = (setValue: SolidSetterParameter<string>) => {
		const setterCallback = typeof setValue === 'string' ? () => setValue : setValue;

		return baseSetter((currentValue) => {
			const newValue = setterCallback(currentValue);

			return setDOMValue(newValue);
		});
	};

	return [getter, setter];
};
