import type { RankControlDefinition } from '../../parse/body/control/RankControlDefinition.ts';
import type {
	UnsupportedControlDefinition,
	UnsupportedControlNode,
} from './UnsupportedControlNode.ts';

export interface RankNodeDefinition extends UnsupportedControlDefinition {
	readonly bodyElement: RankControlDefinition;
}

export interface RankNode extends UnsupportedControlNode {
	readonly nodeType: 'rank';
	readonly definition: RankNodeDefinition;
}
