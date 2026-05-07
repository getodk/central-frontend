import {
	type DOMSetGeopointElement,
	type DOMSetValueElement,
	SET_GEOPOINT_LOCAL_NAME,
	SET_VALUE_LOCAL_NAME,
} from '../XFormDOM.ts';
import { ActionDefinition } from './ActionDefinition.ts';
import { XFORM_EVENT } from './Event.ts';
import type { ModelDefinition } from './ModelDefinition.ts';

const REPEAT_REGEX = /(\[[^\]]*\])/gm;

export class ModelActionMap extends Map<string, ActionDefinition[]> {
	static fromModel(model: ModelDefinition): ModelActionMap {
		return new this(model);
	}

	static getKey(ref: string): string {
		return ref.replace(REPEAT_REGEX, '');
	}

	protected constructor(model: ModelDefinition) {
		super();
		this.addAll(model, model.form.xformDOM.setValues, SET_VALUE_LOCAL_NAME);
		this.addAll(model, model.form.xformDOM.setGeopoints, SET_GEOPOINT_LOCAL_NAME);
	}

	override get(ref: string): ActionDefinition[] | undefined {
		return super.get(ModelActionMap.getKey(ref));
	}

	private addAll(
		model: ModelDefinition,
		elements: readonly DOMSetGeopointElement[] | readonly DOMSetValueElement[],
		type: string
	) {
		for (const element of elements) {
			const action = new ActionDefinition(model, element);
			if (action.events.includes(XFORM_EVENT.odkNewRepeat)) {
				throw new Error(`Model contains "${type}" element with "odk-new-repeat" event`);
			}
			this.add(action);
		}
	}

	add(action: ActionDefinition) {
		const key = ModelActionMap.getKey(action.ref);
		if (this.has(key)) {
			this.get(key)!.push(action);
		} else {
			this.set(key, [action]);
		}
	}
}
