import { Box } from 'suid/material';
import type { EntryState } from '../../lib/xform/state/EntryState.ts';
import { XFormQuesetionList } from './XFormQuestionList.tsx';
import { XFormTitle } from './XFormTitle.tsx';

interface XFormViewProps {
	readonly entry: EntryState;
}

export const XFormView = (props: XFormViewProps) => {
	return (
		<Box>
			<XFormTitle>{props.entry.form.title}</XFormTitle>
			<XFormQuesetionList entry={props.entry} elements={props.entry.getBodyElements()} />
		</Box>
	);
};
