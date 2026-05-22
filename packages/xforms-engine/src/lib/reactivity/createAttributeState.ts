import type { Accessor, Setter, Signal } from 'solid-js';
import { createSignal } from 'solid-js';
import type { Attribute } from '../../instance/Attribute.ts';
import type { ReactiveScope } from './scope.ts';

export interface AttributeState {
	readonly attributes: Signal<readonly Attribute[]>;
	readonly getAttributes: Accessor<readonly Attribute[]>;
	readonly setAttributes: Setter<readonly Attribute[]>;
}

/**
 * Creates attributes state suitable for all node types
 *
 * The produced {@link AttributeState.attributes} (and its get/set convenience
 * methods) signal is intended to be used to store the engine's attribute state,
 * and update that state when appropriate.
 */
export const createAttributeState = (scope: ReactiveScope): AttributeState => {
	return scope.runTask(() => {
		const baseState = createSignal<readonly Attribute[]>([]);
		const [getAttributes, baseSetAttributes] = baseState;

		type AttributeSetterCallback = (prev: readonly Attribute[]) => readonly Attribute[];
		type AttributeOrSetterCallback = AttributeSetterCallback | readonly Attribute[];

		const setAttributes: Setter<readonly Attribute[]> = (
			valueOrSetterCallback: AttributeOrSetterCallback
		) => {
			let setterCallback: AttributeSetterCallback;

			if (typeof valueOrSetterCallback === 'function') {
				setterCallback = valueOrSetterCallback;
			} else {
				setterCallback = (_) => valueOrSetterCallback;
			}

			return baseSetAttributes((prev) => {
				return setterCallback(prev);
			});
		};

		const attributes: Signal<readonly Attribute[]> = [getAttributes, setAttributes];

		return {
			attributes,
			getAttributes,
			setAttributes,
		};
	});
};
