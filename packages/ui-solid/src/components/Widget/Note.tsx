import type { NoteNode } from '@getodk/xforms-engine';
import { XFormRelevanceGuard } from '../XForm/XFormRelevanceGuard.tsx';
import { XFormControlLabel } from '../XForm/controls/XFormControlLabel.tsx';

interface NoteProps {
	readonly node: NoteNode;
}

export const Note = (props: NoteProps) => {
	return (
		<XFormRelevanceGuard isRelevant={props.node.currentState.relevant}>
			<XFormControlLabel label={props.node.currentState.noteText} node={props.node} />
		</XFormRelevanceGuard>
	);
};
