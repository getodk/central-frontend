import { isTextNode } from '@getodk/common/lib/dom/predicates.ts';
import { ActionComputationExpression } from '../expression/ActionComputationExpression.ts';
import type { ModelDefinition } from './ModelDefinition.ts';

export const SET_ACTION_EVENTS = {
	odkInstanceLoad: 'odk-instance-load',
	odkInstanceFirstLoad: 'odk-instance-first-load',
	odkNewRepeat: 'odk-new-repeat',
	xformsValueChanged: 'xforms-value-changed',
} as const;
type SetActionEvent = (typeof SET_ACTION_EVENTS)[keyof typeof SET_ACTION_EVENTS];
const isKnownEvent = (event: SetActionEvent): event is SetActionEvent =>
	Object.values(SET_ACTION_EVENTS).includes(event);

export class ActionDefinition {
	static getRef(model: ModelDefinition, setValueElement: Element): string | null {
		if (setValueElement.hasAttribute('ref')) {
			return setValueElement.getAttribute('ref') ?? null;
		}
		if (setValueElement.hasAttribute('bind')) {
			const bindId = setValueElement.getAttribute('bind');
			const bindDefinition = Array.from(model.binds.values()).find((definition) => {
				return definition.bindElement.getAttribute('id') === bindId;
			});
			return bindDefinition?.nodeset ?? null;
		}
		return null;
	}

	static getValue(element: Element): string {
		if (element.hasAttribute('value')) {
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			return element.getAttribute('value') || "''";
		}
		if (element.firstChild && isTextNode(element.firstChild)) {
			// use the text content as the literal value
			return `'${element.firstChild.nodeValue}'`;
		}
		return "''";
	}

	static getEvents(element: Element): SetActionEvent[] {
		const events = element.getAttribute('event')?.split(' ') ?? [];
		const unknownEvents = events.filter((event) => !isKnownEvent(event as SetActionEvent));
		if (unknownEvents.length) {
			throw new Error(
				`An action was registered for unsupported events: ${unknownEvents.join(', ')}`
			);
		}
		return events as SetActionEvent[];
	}

	readonly ref: string;
	readonly events: SetActionEvent[];
	readonly computation: ActionComputationExpression<'string'>;
	readonly source: string | undefined;

	constructor(
		model: ModelDefinition,
		readonly element: Element,
		source?: string
	) {
		const ref = ActionDefinition.getRef(model, element);
		if (!ref) {
			throw new Error(
				'Invalid setvalue element - you must define either "ref" or "bind" attribute'
			);
		}
		this.ref = ref;
		this.events = ActionDefinition.getEvents(element);
		const value = ActionDefinition.getValue(element);
		this.computation = new ActionComputationExpression('string', value);
		this.source = source;
	}
}
