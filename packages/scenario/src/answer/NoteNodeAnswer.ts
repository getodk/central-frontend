import type { NoteNode } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class NoteNodeAnswer extends ValueNodeAnswer<NoteNode> {
	get stringValue(): string {
		return this.node.currentState.value ?? '';
	}
}
