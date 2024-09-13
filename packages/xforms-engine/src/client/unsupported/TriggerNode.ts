import type { TriggerControlDefinition } from '../../parse/body/control/TriggerControlDefinition.ts';
import type {
	UnsupportedControlDefinition,
	UnsupportedControlNode,
} from './UnsupportedControlNode.ts';

export interface TriggerNodeDefinition extends UnsupportedControlDefinition {
	readonly bodyElement: TriggerControlDefinition;
}

export interface TriggerNode extends UnsupportedControlNode {
	readonly nodeType: 'trigger';
	readonly definition: TriggerNodeDefinition;
}
