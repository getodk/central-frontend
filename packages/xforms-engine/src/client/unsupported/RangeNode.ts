import type { RangeControlDefinition } from '../../parse/body/control/RangeControlDefinition.ts';
import type {
	UnsupportedControlDefinition,
	UnsupportedControlNode,
} from './UnsupportedControlNode.ts';

export interface RangeNodeDefinition extends UnsupportedControlDefinition {
	readonly bodyElement: RangeControlDefinition;
}

export interface RangeNode extends UnsupportedControlNode {
	readonly nodeType: 'range';
	readonly definition: RangeNodeDefinition;
}
