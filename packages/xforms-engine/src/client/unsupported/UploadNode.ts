import type { UploadControlDefinition } from '../../parse/body/control/UploadControlDefinition.ts';
import type {
	UnsupportedControlDefinition,
	UnsupportedControlNode,
} from './UnsupportedControlNode.ts';

export interface UploadNodeDefinition extends UnsupportedControlDefinition {
	readonly bodyElement: UploadControlDefinition;
}

export interface UploadNode extends UnsupportedControlNode {
	readonly nodeType: 'upload';
	readonly definition: UploadNodeDefinition;
}
