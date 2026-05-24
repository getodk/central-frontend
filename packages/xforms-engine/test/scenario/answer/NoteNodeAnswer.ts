import type { AnyNoteNode } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class NoteNodeAnswer extends ValueNodeAnswer<AnyNoteNode> {
	get stringValue(): string {
		return this.node.currentState.instanceValue;
	}
}
