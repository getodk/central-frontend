import type { EntryState } from '@odk-web-forms/xforms-engine';
import { Box } from '@suid/material';
import { XFormQuestionList } from './XFormQuestionList.tsx';
import { XFormTitle } from './XFormTitle.tsx';

interface XFormViewProps {
	readonly entry: EntryState;
}

export const XFormView = (props: XFormViewProps) => {
	return (
		<Box>
			<XFormTitle>{props.entry.form.title}</XFormTitle>
			<XFormQuestionList state={props.entry} />
		</Box>
	);
};
