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

	protected constructor(model: ModelDefinition) {
		super(
			model.form.xformDOM.setValues.map((setValueElement) => {
				const action = new ActionDefinition(model, setValueElement);
				if (action.events.includes(XFORM_EVENT.odkNewRepeat)) {
					throw new Error('Model contains "setvalue" element with "odk-new-repeat" event');
				}
				const key = ModelActionMap.getKey(action.ref);
				return [key, action];
			})
		);
	}

	override get(ref: string): ActionDefinition | undefined {
		return super.get(ModelActionMap.getKey(ref));
	}

	add(action: ActionDefinition) {
		const key = ModelActionMap.getKey(action.ref);
		this.set(key, action);
	}
}
