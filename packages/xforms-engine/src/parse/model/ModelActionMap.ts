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

export class ModelActionMap extends Map<string, ActionDefinition> {
	static fromModel(model: ModelDefinition): ModelActionMap {
		return new this(model);
	}

	static getKey(ref: string): string {
		return ref.replace(REPEAT_REGEX, '');
	}

	private static processActions(
		model: ModelDefinition,
		elements: readonly DOMSetGeopointElement[] | readonly DOMSetValueElement[],
		type: string
	): Array<[string, ActionDefinition]> {
		return elements.map((element) => {
			const action = new ActionDefinition(model, element);
			if (action.events.includes(XFORM_EVENT.odkNewRepeat)) {
				throw new Error(`Model contains "${type}" element with "odk-new-repeat" event`);
			}
			const key = ModelActionMap.getKey(action.ref);
			return [key, action];
		});
	}

	protected constructor(model: ModelDefinition) {
		const entries: Array<[string, ActionDefinition]> = [
			...ModelActionMap.processActions(model, model.form.xformDOM.setValues, SET_VALUE_LOCAL_NAME),
			...ModelActionMap.processActions(
				model,
				model.form.xformDOM.setGeopoints,
				SET_GEOPOINT_LOCAL_NAME
			),
		];
		super(entries);
	}

	override get(ref: string): ActionDefinition | undefined {
		return super.get(ModelActionMap.getKey(ref));
	}

	add(action: ActionDefinition) {
		const key = ModelActionMap.getKey(action.ref);
		this.set(key, action);
	}
}
