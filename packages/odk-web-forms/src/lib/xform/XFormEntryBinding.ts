import type { Accessor, Setter, Signal } from 'solid-js';
import { createCalculate, createModelNodeSignal } from '../reactivity/model-state.ts';
import type { XFormDOM } from './XFormDOM.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import type { XFormEntry } from './XFormEntry.ts';
import type { XFormModelBind } from './XFormModelBind.ts';

export class XFormEntryBinding {
	protected readonly xformDocument: XMLDocument;
	protected readonly model: Element;
	protected readonly primaryInstance: Element;
	protected readonly primaryInstanceRoot: Element;

	// TODO: non-element bindings (i.e. Attr, ...?)
	protected readonly modelNode: Element;

	protected readonly state: Signal<string> | null = null;
	protected readonly getter: Accessor<string>;
	protected readonly setter: Setter<string> | null = null;

	constructor(
		protected readonly form: XFormDefinition,
		protected readonly instanceDOM: XFormDOM,
		_states: XFormEntry,
		readonly bind: XFormModelBind
	) {
		const { xformDocument, model, primaryInstance, primaryInstanceRoot, primaryInstanceEvaluator } =
			instanceDOM;

		this.xformDocument = xformDocument;
		this.model = model;
		this.primaryInstance = primaryInstance;
		this.primaryInstanceRoot = primaryInstanceRoot;

		const modelNode = primaryInstanceEvaluator.evaluateNonNullElement(bind.nodeset);

		this.modelNode = modelNode;

		const { expression: calculateExpression } = bind.calculate;

		if (calculateExpression == null) {
			const state = createModelNodeSignal(modelNode);
			const [getter, setter] = state;

			this.state = state;
			this.getter = getter;
			this.setter = setter;
		} else {
			this.getter = createCalculate(primaryInstanceEvaluator, modelNode, calculateExpression);
		}
	}

	getElement(): Element {
		return this.modelNode;
	}

	getValue(): string {
		return this.getter();
	}

	setValue(value: string): void {
		this.setter?.(value);
	}

	toJSON() {
		return {};
	}
}
